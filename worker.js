export default {
  async fetch(request, env, ctx) {
    const ALPHA_KEY = "12F9YHGH3T1063OB";
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    };

    const safeFetch = async (url) => {
      try {
        const r = await fetch(url, { 
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          cf: { cacheTtl: 10 }
        });
        return r.ok ? await r.json() : null;
      } catch (e) { return null; }
    };

    const handle = async () => {
      // 並行抓取，避免互相等待
      const [vix, fx, cnn, margin, vixtw] = await Promise.all([
        safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX"),
        safeFetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${ALPHA_KEY}`),
        safeFetch("https://api.alternative.me/fng/"),
        safeFetch("https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=2026-03-01"),
        safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW.TW")
      ]);

      let result = {};

      // 1. VIX (Yahoo)
      if (vix?.quoteResponse?.result?.[0]) {
        result.vix = vix.quoteResponse.result[0].regularMarketPrice;
      }
      // 2. USD/TWD (Alpha Vantage 替代 Yahoo)
      if (fx?.["Realtime Currency Exchange Rate"]) {
        result.twd = parseFloat(fx["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
      }
      // 3. CNN (這目前正常)
      if (cnn?.data?.[0]) {
        result.cnn = parseInt(cnn.data[0].value);
      }
      // 4. 融資融券 (FinMind)
      if (margin?.data?.length >= 2) {
        const last = margin.data.at(-1);
        const prev = margin.data.at(-2);
        result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
        result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
      }
      // 5. 台指 VIX
      if (vixtw?.quoteResponse?.result?.[0]) {
        result.vixtw = vixtw.quoteResponse.result[0].regularMarketPrice;
      }

      // 情緒邏輯判斷
      let score = 0;
      if (result.vix > 25) score -= 2;
      if (result.cnn < 25) score += 1.5;
      if (result.cnn > 75) score -= 1.5;
      
      result.sentiment = score >= 1 ? "偏多" : (score <= -1 ? "偏空" : "中性");

      return result;
    };

    return new Response(JSON.stringify(await handle()), { headers });
  }
};
