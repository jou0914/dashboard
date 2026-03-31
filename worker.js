export default {
  async fetch(request) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (url.pathname === "/test") {
      try {
        const res = await fetch(
          "https://query1.finance.yahoo.com/v8/finance/chart/%5ETWII?interval=1d&range=90d"
        );
        const json = await res.json();
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
