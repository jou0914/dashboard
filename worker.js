export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    const API_KEY = "12F9YHGH3T1063OB";

    // 封裝通用 Fetch 函式帶 Log
    const fetchWithLog = async (name, targetUrl, selector = (j) => j) => {
      console.log(`[DEBUG] Requesting ${name}: ${targetUrl}`);
      try {
        const res = await fetch(targetUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const json = await res.json();
        const data = selector(json);
        console.log(`[DEBUG] ${name} Success:`, data);
        return data;
      } catch (e) {
        console.error(`[DEBUG] ${name} Failed:`, e.message);
        return null;
      }
    };

    let result = { price: null };

    if (url.pathname === "/cnn") {
      result = await fetchWithLog("CNN", "https://api.alternative.me/fng/", (j) => ({
        price: parseInt(j.data[0].value),
        label: j.data[0].value_classification
      }));
    } 
    else if (url.pathname === "/vix") {
      result.price = await fetchWithLog("VIX", "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX", (j) => j.quoteResponse.result[0]?.regularMarketPrice);
    }
    else if (url.pathname === "/vixtw") {
      result.price = await fetchWithLog("VIXTW", "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW", (j) => j.quoteResponse.result[0]?.regularMarketPrice);
    }
    else if (url.pathname === "/twd") {
      result.price = await fetchWithLog("TWD", `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${API_KEY}`, (j) => 
        parseFloat(j["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"])
      );
    }
    else if (url.pathname === "/7769") {
      result.price = await fetchWithLog("7769", `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`, (j) => j.data?.pop()?.close);
    }

    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }
};
