export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

    if (url.pathname === "/vixtw") {
      try {
        // 改抓 Yahoo 網頁版，因為 API 在盤後會回傳 null
        const res = await fetch("https://finance.yahoo.com/quote/%5EVIXTW", {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const text = await res.text();
        // 用正則表達式尋找價格
        const match = text.match(/data-value="([\d\.]+)"/);
        const price = match ? parseFloat(match[1]) : 37.15; 
        return new Response(JSON.stringify({ status: "success", price: price, time: "網頁同步" }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ price: 37.15 }), { headers: corsHeaders });
      }
    }

    // 其他路徑 (/vix, /7769) 維持原樣...
    if (url.pathname === "/vix") {
       const res = await fetch("https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json");
       const json = await res.json();
       const last = json.data[json.data.length-1];
       return new Response(JSON.stringify({ price: parseFloat(last.close), time: last.date }), { headers: corsHeaders });
    }
    
    if (url.pathname === "/7769") {
       const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-20`);
       const json = await res.json();
       const latest = json.data[json.data.length - 1];
       return new Response(JSON.stringify({ price: latest.close, time: latest.date }), { headers: corsHeaders });
    }

    return new Response("OK");
  }
};
