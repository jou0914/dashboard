export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // --- 路由 1: 美股 CBOE VIX (保留圖表所需數據) ---
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json");
        const json = await res.json();
        const recent = json.data.slice(-90); // 取最後 90 筆供圖表使用
        const last = recent[recent.length - 1];
        return new Response(JSON.stringify({
          price: parseFloat(last.close),
          time: last.date,
          history: recent.map(d => ({ date: d.date, price: parseFloat(d.close) }))
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: "美股數據抓取失敗" }), { status: 500, headers: corsHeaders });
      }
    }

    // --- 路由 2: 台股 VIXTWN (移除預設值版) ---
    if (url.pathname === "/vixtw") {
      try {
        // 使用 Yahoo Finance API 抓取台股 VIX (^VIXTW)
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/%5EVIXTW?interval=1d&range=1d`;
        const res = await fetch(yUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const json = await res.json();
        
        // 檢查路徑是否存在且有數值
        const result = json.chart.result && json.chart.result[0];
        const price = result ? result.meta.regularMarketPrice : null;

        if (price !== null && price > 0 && price < 200) {
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(price.toFixed(2)),
            time: new Date().toLocaleTimeString('zh-TW', { hour12: false })
          }), { headers: corsHeaders });
        } else {
          throw new Error("API 未回傳有效價格");
        }
      } catch (e) {
        // 這裡不再給 37 預設值，直接回傳 error 狀態
        return new Response(JSON.stringify({ 
          status: "error", 
          message: "台股 VIX 暫時無法取得即時數據",
          price: null // 讓前端顯示 --
        }), { headers: corsHeaders });
      }
    }

    // --- 路由 3: 鴻勁 7769 (維持 FinMind) ---
    if (url.pathname === "/7769") {
      try {
        const start = new Date(Date.now() - 604800000).toISOString().split('T')[0];
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=${start}`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const latest = json.data[json.data.length - 1];
          return new Response(JSON.stringify({ 
            price: latest.close, 
            time: latest.date 
          }), { headers: corsHeaders });
        }
        throw new Error("FinMind 無數據");
      } catch (e) { 
        return new Response(JSON.stringify({ error: "7769 數據異常" }), { headers: corsHeaders }); 
      }
    }

    return new Response("OK", { headers: corsHeaders });
  }
};
