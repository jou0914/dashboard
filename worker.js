export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Content-Type": "application/json"
    };

    // --- 路由 1: 美股 CBOE VIX (保留原本功能) ---
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
        return new Response(JSON.stringify({ error: "美股 VIX 抓取失敗" }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 路由 2: 台股 VIXTW (FinMind 穩定版) ---
    if (url.pathname === "/vixtw") {
      try {
        // 往前抓 10 天確保一定有資料
        const start = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
        const fmUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${start}`;
        
        const res = await fetch(fmUrl);
        const json = await res.json();
        
        // 關鍵修正：檢查 data 是否存在且有長度
        if (json.data && json.data.length > 0) {
          const latest = json.data[json.data.length - 1];
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(latest.close),
            time: latest.date
          }), { headers: corsHeaders });
        } else {
          throw new Error("FinMind 無回傳數據");
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: "台股 VIX 暫時無數據", price: 0 }), { headers: corsHeaders });
      }
    }

    // --- 路由 3: 鴻勁 7769 ---
    if (url.pathname === "/7769") {
      try {
        const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=${start}`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({
          price: parseFloat(latest.close),
          time: latest.date
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "7769 抓取失敗" }), { headers: corsHeaders });
      }
    }

    return new Response("Worker is running", { headers: corsHeaders });
  }
};
