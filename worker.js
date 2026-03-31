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

    return new Response("OK");
  }
};
