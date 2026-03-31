export default {
  async fetch(request, env, ctx) {
    const ALPHA_KEY = "12F9YHGH3T1063OB";
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    const safeFetch = async (url) => {
      try {
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        return r.ok ? await r.json() : null;
      } catch (e) { return null; }
    };

    const handle = async () => {
      const url = new URL(request.url);
      if (url.pathname !== "/market") return { error: "No route" };

      // 使用 Promise.allSettled 確保其中一個 API 壞掉不會影響全部
      const results = await Promise.allSettled([
        safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX"), // 美股VIX
        safeFetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${ALPHA_KEY}`), // 匯率
        safeFetch("https://api.alternative.me/fng/"), // CNN
        safeFetch("https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockMarginPurchaseShortSale&data_id=TAIEX&start_date=2026-03-01"),
        safeFetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW.TW") // 台指VIX
      ]);

      let data = {};

      // 1. VIX
      if (results[0].value?.quoteResponse?.result?.[0]) {
        data.vix = results[0].value.quoteResponse.result[0].regularMarketPrice;
      }
      // 2. USD/TWD (Alpha Vantage)
      if (results[1].value?.["Realtime Currency Exchange Rate"]) {
        data.twd = parseFloat(results[1].value["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
      }
      // 3. CNN
      if (results[2].value?.data?.[0]) {
        data.cnn = parseInt(results[2].value.data[0].value);
      }
      // 4. 融資融券
      const margin = results[3].value;
      if (margin?.data?.length >= 2) {
        const last = margin.data.at(-1);
        const prev = margin.data.at(-2);
        data.marginChange = last.MarginPurchaseBalance - prev.MarginPurchaseBalance;
        data.shortChange = last.ShortSaleBalance - prev.ShortSaleBalance;
      }
      // 5. 台指 VIX
      if (results[4].value?.quoteResponse?.result?.[0]) {
        data.vixtw = results[4].value.quoteResponse.result[0].regularMarketPrice;
      }

      // 情緒判斷
      let score = 0;
      if (data.vix > 25) score -= 2;
      if (data.cnn < 30) score += 1;
      if (data.cnn > 70) score -= 1;
      
      data.sentiment = score >= 1 ? "偏多" : (score <= -1 ? "偏空" : "中性");

      return data;
    };

    return new Response(JSON.stringify(await handle()), { headers });
  }
};
