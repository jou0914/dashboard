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
        const last = dataPoints[dataPoints.length - 1];
        const price = last[1];

        return new Response(
          JSON.stringify({
            type: "vix",
            price: price,
            time: new Date().toLocaleTimeString("zh-TW")
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

    return new Response("OK");
  }
};
