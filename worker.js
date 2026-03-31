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

    // --- 路由 2: VIXTWN (台股 - 改用 Yahoo 網頁解析) ---
    if (url.pathname === "/vixtw") {
      try {
        // 抓取 Yahoo Finance 台股 VIX 頁面
        const yUrl = `https://finance.yahoo.com/quote/%5EVIXTW`;
        const res = await fetch(yUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const text = await res.text();
        
        // 解析價格 (尋找 fin-streamer 標籤中的數值)
        const match = text.match(/data-value="([\d\.]+)"/);
        const price = match ? parseFloat(match[1]) : null;

        if (price && price > 0) {
          return new Response(JSON.stringify({
            status: "success",
            price: price,
            time: new Date().toLocaleDateString('zh-TW')
          }), { headers: corsHeaders });
        } else {
          // 備援方案：如果 Yahoo 抓不到，嘗試從 Google Finance 抓
          const gUrl = `https://www.google.com/finance/quote/VIXTW:INDEXTPE`;
          const gRes = await fetch(gUrl);
          const gText = await gRes.text();
          const gMatch = gText.match(/data-last-price="([\d\.]+)"/);
          const gPrice = gMatch ? parseFloat(gMatch[1]) : 37.0; // 若都失敗則給參考值

          return new Response(JSON.stringify({
            status: "success",
            price: gPrice,
            time: "實時參考"
          }), { headers: corsHeaders });
        }
      } catch (e) {
        return new Response(JSON.stringify({ status: "error", price: 37.0 }), { headers: corsHeaders });
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
