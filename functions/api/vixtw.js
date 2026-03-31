export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // 允許您的 Pages 網域存取
      "Content-Type": "application/json"
    };

    try {
      const url = "https://corsproxy.io/?https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";
      const response = await fetch(url);
      let text = await response.text();

      text = text.replace(/^\uFEFF/, ""); // 移除 BOM
      const rows = text.split(/\r?\n/);
      const parsed = rows.slice(1).map(r => r.trim()).filter(Boolean).map(r => {
        const [date, raw] = r.split(",");
        const price = parseFloat((raw || "").replace(/[^0-9.]/g, ""));
        return { date, price };
      }).filter(d => d.date && d.price);

      if (parsed.length < 2) throw new Error("資料不足");

      const latest = parsed.at(-1);
      const prev = parsed.at(-2);

      return new Response(JSON.stringify({
        price: latest.price,
        change: latest.price - prev.price,
        status: "success"
      }), { headers: corsHeaders });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message, status: "error" }), { headers: corsHeaders });
    }
  }
};
