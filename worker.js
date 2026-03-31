export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    const API_KEY = "12F9YHGH3T1063OB";
    const VERSION = "1.5.0";

    const fetchWithLog = async (name, targetUrl, selector) => {
      try {
        const res = await fetch(targetUrl, { 
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } 
        });
        if (!res.ok) return { price: null, error: `HTTP ${res.status}` };
        const json = await res.json();
        const price = selector(json);
        return { price: price || null, error: price ? null : "Data Not Found" };
      } catch (e) {
        return { price: null, error: e.message };
      }
    };

    let responseData = { version: VERSION, price: null, error: null };

    if (url.pathname === "/cnn") {
      const d = await fetchWithLog("CNN", "https://api.alternative.me/fng/", (j) => j.data[0].value);
      responseData = { ...responseData, price: parseInt(d.price), label: "CNN Index", error: d.error };
    } 
    else if (url.pathname === "/vix") {
      const d = await fetchWithLog("VIX", "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX", (j) => j.quoteResponse.result[0]?.regularMarketPrice);
      responseData = { ...responseData, ...d };
    }
    else if (url.pathname === "/vixtw") {
      const d = await fetchWithLog("VIXTW", "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW", (j) => j.quoteResponse.result[0]?.regularMarketPrice);
      responseData = { ...responseData, ...d };
    }
    else if (url.pathname === "/twd") {
      const d = await fetchWithLog("TWD", `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${API_KEY}`, 
        (j) => j["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"]);
      responseData = { ...responseData, price: d.price ? parseFloat(d.price) : null, error: d.error || (responseData.price ? null : "API Limit/Error") };
    }
    else if (url.pathname === "/7769") {
      const d = await fetchWithLog("7769", `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`, (j) => j.data?.pop()?.close);
      responseData = { ...responseData, ...d };
    }

    return new Response(JSON.stringify(responseData), { headers: corsHeaders });
  }
};
