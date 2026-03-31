export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
      "Content-Type": "application/json"
    };

    if (url.pathname === "/vix") {
      try {
        // 台灣期交所 VIX 頁面
        const targetUrl = "https://www.taifex.com.tw/cht/7/vixSummary";
        
        // 模擬瀏覽器請求，避免被擋
        const res = await fetch(targetUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
        });
        const html = await res.text();

        // 使用簡單的正規表達式從 HTML 表格中提取第一個 VIX 數值 (最新)
        // 台灣期交所的結構通常是 <td>數值</td>
        const regex = /<td class="center">(\d+\.\d+)<\/td>/g;
        let matches = [];
        let m;
        while ((m = regex.exec(html)) !== null) {
          matches.push(parseFloat(m[1]));
        }

        // 假設第一筆就是最新的 VIX
        const currentPrice = matches[0] || 0;
        
        // 構造回傳格式 (因官網歷史資料需分頁，此處先回傳當前值)
        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: currentPrice,
            time: new Date().toISOString(),
            // 這裡可以放入你模擬或抓到的歷史數據
            history: matches.slice(0, 10).map((v, i) => ({ index: i, price: v })) 
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
    return new Response("Worker is running");
  }
};
