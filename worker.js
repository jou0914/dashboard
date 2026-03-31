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

        // 先把原始資料回傳來看格式
        return new Response(JSON.stringify(json), { headers: corsHeaders });

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
