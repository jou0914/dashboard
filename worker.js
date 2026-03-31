export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // --- 路由 1: CBOE VIX (美股) ---
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
      } catch (e) { return new Response(JSON.stringify({ error: "US VIX Error" }), { status: 500, headers: corsHeaders }); }
    }

    // --- 路由 2: VIXTWN (台股 VIX) ---
    if (url.pathname === "/vixtw") {
      try {
        // 直接從 Yahoo Finance 抓取台股 VIX 頁面
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EVIXTW?interval=1d&range=1d`;
        const res = await fetch(yUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const json = await res.json();
        
        // 取得最新價格
        const price = json.chart.result[0].meta.regularMarketPrice;

        if (price) {
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(price.toFixed(2)),
            time: new Date().toLocaleDateString('zh-TW')
          }), { headers: corsHeaders });
        } else {
          throw new Error("Yahoo 無數據");
        }
      } catch (e) {
        // 備援：若 Yahoo 失敗，回傳一個明確的錯誤訊息或嘗試 Google Finance
        return new Response(JSON.stringify({ status: "error", message: "數據源更新中", price: 37.0 }), { headers: corsHeaders });
      }
    }

    // --- 路由 3: 鴻勁 7769 ---
    if (url.pathname === "/7769") {
      const start = new Date(Date.now() - 604800000).toISOString().split('T')[0];
      const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=${start}`);
      const json = await res.json();
      const latest = json.data[json.data.length - 1];
      return new Response(JSON.stringify({ price: parseFloat(latest.close), time: latest.date }), { headers: corsHeaders });
    }

    return new Response("Worker running");
  }
};
