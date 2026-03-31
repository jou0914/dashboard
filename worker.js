export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // 1. 美股 VIX (CBOE)
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json");
        const json = await res.json();
        const recent = json.data.slice(-90);
        return new Response(JSON.stringify({
          price: parseFloat(recent[recent.length - 1].close),
          time: recent[recent.length - 1].date,
          history: recent.map(d => ({ date: d.date, price: parseFloat(d.close) }))
        }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ error: "US Error" }), { headers: corsHeaders }); }
    }

    // 2. 台股 VIXTWN (修正抓取邏輯)
    if (url.pathname === "/vixtw") {
      try {
        const yUrl = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=%5EVIXTW`;
        const res = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        if (result && result.regularMarketPrice) {
          return new Response(JSON.stringify({
            status: "success",
            price: result.regularMarketPrice,
            time: new Date(result.regularMarketTime * 1000).toLocaleString('zh-TW')
          }), { headers: corsHeaders });
        }
        throw new Error("No Price");
      } catch (e) { return new Response(JSON.stringify({ status: "error", price: null }), { headers: corsHeaders }); }
    }

    // 3. 鴻勁 7769 (FinMind)
    if (url.pathname === "/7769") {
      try {
        const start = new Date(Date.now() - 604800000).toISOString().split('T')[0];
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=${start}`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({ price: latest.close, time: latest.date }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ error: "7769 Error" }), { headers: corsHeaders }); }
    }

    return new Response("VIX Worker Running", { headers: corsHeaders });
  }
};
