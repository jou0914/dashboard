export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json;charset=UTF-8" };
    const VERSION = "1.8.2";

    // 封裝安全 Fetch
    const safeFetch = async (target) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5秒超時
        const res = await fetch(target, { 
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
          signal: controller.signal 
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) { return { error: e.message }; }
    };

    let resData = { version: VERSION, price: null, change: 0, isUp: true, error: null };

    if (url.pathname === "/cnn") {
      const j = await safeFetch("https://api.alternative.me/fng/");
      if (!j.error) resData = { price: parseInt(j.data[0].value), label: j.data[0].value_classification };
      else resData.error = j.error;
    } 
    else if (url.pathname === "/vix" || url.pathname === "/vixtw" || url.pathname === "/twd") {
      const sym = url.pathname === "/vix" ? "%5EVIX" : (url.pathname === "/vixtw" ? "%5EVIXTW" : "TWD=X");
      const j = await safeFetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}`);
      if (!j.error && j.quoteResponse?.result?.[0]) {
        const r = j.quoteResponse.result[0];
        resData = { price: r.regularMarketPrice, change: r.regularMarketChangePercent || 0, isUp: (r.regularMarketChangePercent || 0) >= 0 };
      } else {
        // TWD 備援方案
        if (url.pathname === "/twd") {
          const j2 = await safeFetch("https://open.er-api.com/v6/latest/USD");
          if (!j2.error) resData = { price: j2.rates.TWD, change: 0, isUp: true };
        }
        resData.error = j.error || "No Data";
      }
    }
    else if (url.pathname === "/7769") {
      const j = await safeFetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
      if (!j.error && j.data?.length >= 2) {
        const last = j.data[j.data.length - 1];
        const prev = j.data[j.data.length - 2];
        const change = ((last.close - prev.close) / prev.close) * 100;
        resData = { price: last.close, change: change, isUp: change >= 0 };
      } else resData.error = "FinMind Error";
    }

    return new Response(JSON.stringify(resData), { headers: corsHeaders });
  }
};
