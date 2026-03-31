// worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS header（讓前端可以跨域呼叫）
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (url.pathname === "/vix") {
      try {
        const res = await fetch(
          "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1m&range=1d"
        );
        const json = await res.json();

        const closes = json.chart.result[0].indicators.quote[0].close;

        let price = null;
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] !== null) {
            price = closes[i];
            break;
          }
        }

        if (!price) {
          return new Response(JSON.stringify({ error: "no data" }), {
            headers: corsHeaders
          });
        }

        return new Response(
          JSON.stringify({
            type: "vix",
            price: price,
            time: new Date().toLocaleTimeString("zh-TW")
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ error: "fetch failed" }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response("OK");
  }
};
