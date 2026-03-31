export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // --- 僅測試 VIXTWN ---
    if (url.pathname === "/vixtw") {
      try {
        // 使用 Yahoo Finance v6 接口，這對 ^VIXTW 指數較穩定
        const yUrl = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=%5EVIXTW`;
        const res = await fetch(yUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const json = await res.json();
        
        const result = json.quoteResponse.result[0];
        const price = result ? result.regularMarketPrice : null;

        if (price !== null) {
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(price.toFixed(2)),
            time: new Date(result.regularMarketTime * 1000).toLocaleString('zh-TW')
          }), { headers: corsHeaders });
        } else {
          throw new Error("No Price Data");
        }
      } catch (e) {
        return new Response(JSON.stringify({ 
          status: "error", 
          message: "無法取得數據，請檢查指數代碼",
          debug: e.message
        }), { headers: corsHeaders });
      }
    }

    // --- 保留美股 VIX 供圖表使用 ---
    if (url.pathname === "/vix") {
      const res = await fetch("https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json");
      const json = await res.json();
      const recent = json.data.slice(-90);
      return new Response(JSON.stringify({
        price: parseFloat(recent[recent.length-1].close),
        time: recent[recent.length-1].date,
        history: recent.map(d => ({ date: d.date, price: parseFloat(d.close) }))
      }), { headers: corsHeaders });
    }

    return new Response("VIX Tester Running");
  }
};
