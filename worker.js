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
          cf: { cacheTtl: 30 }
        });
        if (!r.ok) return null;
        return await r.json();
      } catch (e) { return null; }
    };

    const handle = async () => {
      // 今天日期動態產生
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const startDate = `${yyyy}-${mm}-01`;

      const [vix, fx, cnn, margin] = await Promise.all([
        // ✅ 改用 v8 API
        safeFetch("https://query1.finance.yahoo.com/v8/finance/quote?symbols=%5EVIX"),
        // ✅ Alpha Vantage USD/TWD
        safeFetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${ALPHA_KEY}`),
        // ✅ CNN Fear & Greed (alternative.me 仍正常)
        safeFetch("https://api.alternative.me/fng/"),
        // ✅ FinMind 融資融券，動態日期
        safeFetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=${startDate}`)
      ]);

      let result = {};

      // 1. VIX
      const vixResult = vix?.quoteResponse?.result?.[0];
      if (vixResult) {
        result.vix = vixResult.regularMarketPrice;
      }

      // 2. USD/TWD
      const fxData = fx?.["Realtime Currency Exchange Rate"];
      if (fxData?.["5. Exchange Rate"]) {
        result.twd = parseFloat(fxData["5. Exchange Rate"]);
      }

      // 3. CNN Fear & Greed
      if (cnn?.data?.[0]) {
        result.cnn = parseInt(cnn.data[0].value);
        result.cnnLabel = cnn.data[0].value_classification;
      }

      // 4. 融資融券
      if (margin?.data?.length >= 2) {
        const last = margin.data.at(-1);
        const prev = margin.data.at(-2);
        result.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
        result.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
      }

      // 5. 台指VIX — Yahoo 無可靠代碼，改​​​​​​​​​​​​​​​​
