export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    const API_KEY = "12F9YHGH3T1063OB"; // 你的 Alpha Vantage 金鑰

    // 1. CNN Fear & Greed (維持原樣，很穩定)
    if (url.pathname === "/cnn") {
      try {
        const res = await fetch("https://api.alternative.me/fng/");
        const json = await res.json();
        return new Response(JSON.stringify({ price: parseInt(json.data[0].value), label: json.data[0].value_classification }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 2. 台幣匯率 (使用 Alpha Vantage)
    if (url.pathname === "/twd") {
      try {
        const res = await fetch(`https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=TWD&apikey=${API_KEY}`);
        const json = await res.json();
        const rate = json["Realtime Currency Exchange Rate"]["5. Exchange Rate"];
        return new Response(JSON.stringify({ price: parseFloat(parseFloat(rate).toFixed(3)) }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 3. 美股 VIX (備援機制)
    if (url.pathname === "/vix") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIX", { headers: { "User-Agent": "Mozilla/5.0" } });
        const json = await res.json();
        return new Response(JSON.stringify({ price: json.quoteResponse.result[0].regularMarketPrice }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 4. 台股 VIX (^VIXTW)
    if (url.pathname === "/vixtw") {
      try {
        const res = await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EVIXTW", { headers: { "User-Agent": "Mozilla/5.0" } });
        const json = await res.json();
        return new Response(JSON.stringify({ price: json.quoteResponse.result[0]?.regularMarketPrice || null }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    // 5. 鴻勁 (7769)
    if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const json = await res.json();
        return new Response(JSON.stringify({ price: json.data[json.data.length - 1].close }), { headers: corsHeaders });
      } catch (e) { return new Response(JSON.stringify({ price: null }), { headers: corsHeaders }); }
    }

    return new Response("OK");
  }
};
