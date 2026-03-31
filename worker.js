export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    // --- 路徑 1: 原本的 CBOE VIX (美股) ---
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
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 路徑 2: 新增的台股 VIXTWN (FinMind 來源) ---
    if (url.pathname === "/vixtw") {
      try {
        const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${start}`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({
          price: parseFloat(latest.close),
          time: latest.date
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response("OK", { headers: corsHeaders });
  }
};
