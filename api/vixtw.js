export default {
  async fetch(request, env, ctx) {
    // 設定 CORS，讓前端網頁可以跨網域讀取數據
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Content-Type": "application/json"
    };

    try {
      const url = "https://corsproxy.io/?https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";
      const response = await fetch(url);
      let text = await response.text();

      text = text.replace(/^\uFEFF/, ""); // 處理 UTF-8 BOM
      const rows = text.split(/\r?\n/);

      const parsed = rows
        .slice(1)
        .map(r => r.trim())
        .filter(Boolean)
        .map(r => {
          const [date, raw] = r.split(",");
          const price = parseFloat((raw || "").replace(/[^0-9.]/g, ""));
          return { date, price };
        })
        .filter(d => d.date && d.price);

      if (parsed.length < 2) {
        return new Response(JSON.stringify({ price: 0, status: "無有效資料" }), { headers: corsHeaders });
      }

      const latest = parsed.at(-1);
      const prev = parsed.at(-2);

      const result = {
        price: latest.price,
        change: latest.price - prev.price,
        changePct: ((latest.price - prev.price) / prev.price) * 100,
        date: latest.date,
        status: "success",
      };

      return new Response(JSON.stringify(result), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message, status: "error" }), { headers: corsHeaders });
    }
  }
};
