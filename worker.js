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
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        if (!r.ok) throw new Error(r.status);
        return await r.json();
      } catch (e) {
        return { error: e.message };
      }
    };

    const handle = async () => {
      const path = new URL(request.url).pathname;

      // 🔥 市場總覽（核心）
      if (path === "/market") {

        // VIX
        const vix = await safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX");

        // 匯率
        const fx = await safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=TWD=X");

        // CNN
        const cnn = await safeFetch("https://api.alternative.me/fng/");

        // 融資融券（FinMind）
        const margin = await safeFetch(
          "https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=2026-03-01"
        );

        let result = {};

        // VIX
        if (vix.quoteResponse?.result?.[0]) {
          const r = vix.quoteResponse.result[0];
          result.vix = r.regularMarketPrice;
        }

        // 匯率
        if (fx.quoteResponse?.result?.[0]) {
          result.twd = fx.quoteResponse.result[0].regularMarketPrice;
        }

        // CNN
        if (!cnn.error) {
          result.cnn = parseInt(cnn.data[0].value);
        }

        // 融資融券
        if (margin.data?.length >= 2) {
          const last = margin.data.at(-1);
          const prev = margin.data.at(-2);

          result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
          result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
        }

        // 🔥 AI 判讀（重點）
        let score = 0;

        if (result.vix > 25) score -= 2;
        else if (result.vix < 15) score += 1;

        if (result.cnn < 30) score += 1;
        if (result.cnn > 70) score -= 1;

        if (result.marginChange > 0) score += 1;
        if (result.shortChange > 0) score -= 1;

        let sentiment = "中性";
        if (score >= 2) sentiment = "偏多";
        if (score <= -2) sentiment = "偏空";

        result.sentiment = sentiment;

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
