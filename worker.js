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
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX");
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        return new Response(JSON.stringify({
          price: result.regularMarketPrice,
          time: new Date(result.regularMarketTime * 1000).toISOString().split('T')[0]
        }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: 27.28 }), { headers: corsHeaders }); }
    }

    // 2. 台股 VIXTWN (修正抓取邏輯，避免抓到 S&P 500)
    if (url.pathname === "/vixtw") {
      try {
        // 使用 v7 API 強制指定抓取 ^VIXTW
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW", {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        
        if (result && result.regularMarketPrice) {
          return new Response(JSON.stringify({
            status: "success",
            price: parseFloat(result.regularMarketPrice.toFixed(2)),
            time: "Yahoo API"
          }), { headers: corsHeaders });
        }
        throw new Error("No Data");
      } catch (e) {
        // 萬一 API 真的沒給，回傳最後已知的盤後參考值 37.15
        return new Response(JSON.stringify({ status: "fallback", price: 37.15, time: "盤後參考" }), { headers: corsHeaders });
      }
    }

    // 3. 鴻勁 7769
    if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({ price: latest.close, time: latest.date }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: 3505 }), { headers: corsHeaders }); }
    }

    return new Response("OK");
  }
};
