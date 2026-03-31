export default {
  async fetch(request) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (url.pathname === "/vix") {
      try {
        const res = await fetch(
          "https://cdn.cboe.com/api/global/delayed_quotes/charts/historical/_VIX.json"
        );
        const json = await res.json();

        const dataPoints = json.data;

        // 取最後 90 筆
        const recent = dataPoints.slice(-90);

        const last = recent[recent.length - 1];
        const price = parseFloat(last.close);

        const history = recent.map(d => ({
          date: d.date,
          price: parseFloat(d.close)
        }));

        return new Response(
          JSON.stringify({
            type: "vix",
            price: price,
            time: last.date,
            history: history
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // --- 修復後的 VIXTWN 路由 ---
if (url.pathname === "/vixtw") {
  try {
    const yUrl = `https://query2.finance.yahoo.com/v6/finance/quote?symbols=%5EVIXTW`;
    const res = await fetch(yUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const json = await res.json();
    const result = json.quoteResponse.result[0];
    
    if (result && result.regularMarketPrice) {
      return new Response(JSON.stringify({
        status: "success",
        price: result.regularMarketPrice,
        time: new Date(result.regularMarketTime * 1000).toLocaleString('zh-TW')
      }), { headers: corsHeaders });
    }
    throw new Error("No Data");
  } catch (e) {
    return new Response(JSON.stringify({ status: "error", price: null }), { headers: corsHeaders });
  }
}


    return new Response("OK");
  }
};
