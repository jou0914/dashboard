export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    // 1. CNN Fear & Greed
    if (url.pathname === "/cnn") {
      try {
        const res = await fetch("https://api.alternative.me/fng/");
        const json = await res.json();
        return new Response(JSON.stringify({ price: parseInt(json.data[0].value), label: json.data[0].value_classification }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 2. 美股 VIX (^VIX)
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX");
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        return new Response(JSON.stringify({ price: result.regularMarketPrice, time: result.regularMarketTime }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 3. 台股 VIX (^VIXTW)
    if (url.pathname === "/vixtw") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW");
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        return new Response(JSON.stringify({ price: result ? parseFloat(result.regularMarketPrice.toFixed(2)) : null }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 4. 台幣匯率 (USD/TWD)
    if (url.pathname === "/twd") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=TWD=X");
        const json = await res.json();
        const result = json.quoteResponse.result[0];
        return new Response(JSON.stringify({ price: parseFloat(result.regularMarketPrice.toFixed(3)) }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 5. 鴻勁 (7769)
    if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const json = await res.json();
        const latest = json.data[json.data.length - 1];
        return new Response(JSON.stringify({ price: latest.close }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    return new Response("OK");
  }
};
