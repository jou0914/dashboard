export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8" // 強制 UTF-8 避免亂碼
    };

    // --- 路由 1: CBOE VIX (美股) ---
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json");
        const json = await res.json();
        const recent = json.data.slice(-90);
        const last = recent[recent.length - 1];
        return new Response(JSON.stringify({
          price: parseFloat(last.close),
          time: last.date,
          history: recent.map(d => ({ date: d.date, price: parseFloat(d.close) }))
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "VIX Fetch Error" }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 路由 2: VIXTWN (台股) ---
    if (url.pathname === "/vixtw") {
      try {
        const start = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${start}`);
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
          const latest = json.data[json.data.length - 1];
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(latest.close),
            time: latest.date
          }), { headers: corsHeaders });
        } else {
          // 若無數據，回傳 price: 0 讓前端處理
          return new Response(JSON.stringify({ status: "nodata", price: 0 }), { headers: corsHeaders });
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: "API Error", price: 0 }), { headers: corsHeaders });
      }
    }

    return new Response("OK", { headers: corsHeaders });
  }
};
