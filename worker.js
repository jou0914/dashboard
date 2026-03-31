export default {
  async fetch(request, env, ctx) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Cache-Control": "max-age=20"
    };

    const cache = caches.default;

    const safeFetch = async (url) => {
      try {
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          cf: { cacheTtl: 20 }
        });
        if (!r.ok) return { error: r.status };
        return await r.json();
      } catch (e) {
        return { error: e.message };
      }
    };

    const handle = async () => {
      const path = new URL(request.url).pathname;

      if (path === "/market") {
        // 同步抓取所有資料源
        const [vix, fx, cnn, margin, vixtw] = await Promise.all([
          safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX"),
          safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=TWD=X"),
          safeFetch("https://api.alternative.me/fng/"),
          safeFetch("https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=2026-03-01"),
          safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW.TW")
        ]);

        let result = {};

        // 僅在資料正確時填入，不給予預設值
        if (vix?.quoteResponse?.result?.[0]) result.vix = vix.quoteResponse.result[0].regularMarketPrice;
        if (vixtw?.quoteResponse?.result?.[0]) result.vixtw = vixtw.quoteResponse.result[0].regularMarketPrice;
        if (fx?.quoteResponse?.result?.[0]) result.twd = fx.quoteResponse.result[0].regularMarketPrice;
        
        // CNN 恐慌指數處理
        if (!cnn.error && cnn.data?.[0]) {
          result.cnn = parseInt(cnn.data[0].value);
        }

        // 融資融券處理
        if (margin.data?.length >= 2) {
          const last = margin.data.at(-1);
          const prev = margin.data.at(-2);
          result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
          result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
        }

        // AI 判讀邏輯
        let score = 0;
        if (result.vix > 25) score -= 2;
        if (result.cnn < 30) score += 1; // 極度恐慌通常是買點
        if (result.cnn > 70) score -= 1; // 極度貪婪需謹慎
        if (result.marginChange > 0) score += 0.5;

        result.sentiment = score >= 1.5 ? "偏多" : (score <= -1.5 ? "偏空" : "中性");

        return result;
      }
      return { error: "No route" };
    };

    const cacheKey = new Request(request.url);
    let res = await cache.match(cacheKey);

    if (!res) {
      const data = await handle();
      res = new Response(JSON.stringify(data), { headers });
      ctx.waitUntil(cache.put(cacheKey, res.clone()));
    }

    return res;
  }
};
