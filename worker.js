export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json;charset=UTF-8"
    };

    const fetchYahoo = async (symbol) => {
      try {
        const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await res.json();
        return json.quoteResponse.result[0]?.regularMarketPrice || null;
      } catch (e) { return null; }
    };

    let result = { price: null };

    if (url.pathname === "/cnn") {
      try {
        const res = await fetch("https://api.alternative.me/fng/");
        const json = await res.json();
        result = { price: parseInt(json.data[0].value), label: json.data[0].value_classification };
      } catch (e) {}
    } 
    else if (url.pathname === "/vix") result.price = await fetchYahoo("^VIX");
    else if (url.pathname === "/vixtw") result.price = await fetchYahoo("^VIXTW");
    else if (url.pathname === "/twd") result.price = await fetchYahoo("TWD=X");
    else if (url.pathname === "/7769") {
      try {
        const res = await fetch(`https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=7769&start_date=2026-03-25`);
        const json = await res.json();
        result.price = json.data[json.data.length - 1]?.close || null;
      } catch (e) {}
    }

    return new Response(JSON.stringify(result), { headers: corsHeaders });
  }
};
