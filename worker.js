export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // 1. 美股 VIX (^VIX)
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX");
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        return new Response(JSON.stringify({
          price: result.regularMarketPrice,
          time: new Date(result.regularMarketTime * 1000).toLocaleDateString('zh-TW')
        }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 2. 台股 VIX (^VIXTW) - 修正抓取邏輯
    if (url.pathname === "/vixtw") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW", {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        if (result && result.regularMarketPrice) {
          return new Response(JSON.stringify({
            price: parseFloat(result.regularMarketPrice.toFixed(2)),
            time: new Date(result.regularMarketTime * 1000).toLocaleTimeString('zh-TW')
          }), { headers: corsHeaders });
        }
        throw new Error();
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 3. CNN 恐慌與貪婪指數 (Fear & Greed)
    if (url.pathname === "/cnn") {
      try {
        // 使用第三方轉接 API 獲取 CNN 數據
        const res = await fetch("https://api.alternative.me/fng/");
        const json = await res.json();
        return new Response(JSON.stringify({
          price: parseInt(json.data[0].value),
          label: json.data[0].value_classification
        }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 4. 鴻勁 (7769)
    if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({ price: latest.close, time: latest.date }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    return new Response("API Active");
  }
};
