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
          "https://stooq.com/q/d/l/?s=^twii&i=d"
    );
    const text = await res.text();
    return new Response(text, { headers: corsHeaders });
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
