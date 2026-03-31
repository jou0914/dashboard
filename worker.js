export default { // 修正為小寫 export
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
          cf: { cacheTtl: 60 } // 快取時間可稍微拉長
        });
        return r.ok ? await r.json() : null;
      } catch (e) { return null; }
    };

    const handle = async () => {
      // 修正日期邏輯：抓過去 15 天確保有足夠的比較數據
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000));
      const startDate = fifteenDaysAgo.toISOString().split('T')[0];

      // 所有的 fetch 全部併行，縮短 Worker 執行時間
      const [vix, fx, cnn, margin, vixtw] = await Promise.all([
        safeFetch("https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5EVIX"),
        safeFetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${ALPHA_KEY}`),
        safeFetch("https://api.alternative.me/fng/"),
        safeFetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=${startDate}`),
        safeFetch("https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5ETWVIX")
      ]);

      let result = {};

      // 1. VIX 解析
      const vixVal = vix?.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (vixVal) result.vix = vixVal;

      // 2. USD/TWD
      const rate = fx?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
      if (rate) result.twd = parseFloat(rate);

      // 3. CNN (alternative.me)
      if (cnn?.data?.[0]) {
        result.cnn = parseInt(cnn.data[0].value);
        result.cnnLabel = cnn.data[0].value_classification;
      }

      // 4. 融資融券 (FinMind)
      if (margin?.data && margin.data.length >= 2) {
        const last = margin.data[margin.data.length - 1];
        const prev = margin.data[margin.data.length - 2];
        result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
        result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
      }

      // 5. 台指 VIX
      const twVixVal = vixtw?.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (twVixVal) result.vixtw = twVixVal;

      // 情緒評分邏輯 (保持原樣或微調)
      let score = 0;
      if (result.vix > 30) score -= 2;
      else if (result.vix > 20) score -= 1;
      
      if (result.cnn < 25) score += 1.5;
      else if (result.cnn > 75) score -= 1.5;

      if (result.marginChange > 0) score += 0.5;
      else if (result.marginChange < 0) score -= 0.5;

      result.sentiment = score >= 1 ? "偏多" : (score <= -1 ? "偏空" : "中性");
      result.score = score;
      result.updatedAt = new Date().toISOString();

      return result;
    };

    try {
      const data = await handle();
      return new Response(JSON.stringify(data), { headers });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { headers, status: 500 });
    }
  }
};
