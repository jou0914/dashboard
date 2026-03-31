export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    };

    if (url.pathname === "/vix") {
      try {
        // 抓取台灣期交所 VIX 彙總頁面
        const targetUrl = "https://www.taifex.com.tw/cht/7/vixSummary";
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html"
          }
        });
        const html = await res.text();

        // --- 改進的解析邏輯 ---
        // 期交所最新一筆 VIX 通常位在第一個 <td class="center"> 標籤中
        // 我們先過濾掉換行與多餘空白，增加匹配成功率
        const cleanHtml = html.replace(/\s+/g, ' ');
        const regex = /<td class="center">([\d.]+)\s*<\/td>/g;
        
        let matches = [];
        let m;
        while ((m = regex.exec(cleanHtml)) !== null) {
          matches.push(parseFloat(m[1]));
        }

        // 如果 Regex 還是抓不到，嘗試備用的字串尋找法
        let currentPrice = matches.length > 0 ? matches[0] : 0;
        
        if (currentPrice === 0) {
            // 尋找「指數值」欄位後的關鍵字
            const marker = 'class="center">';
            const index = html.indexOf(marker);
            if (index !== -1) {
                const subStr = html.substring(index + marker.length, index + marker.length + 10);
                const fallbackMatch = subStr.match(/[\d.]+/);
                if (fallbackMatch) currentPrice = parseFloat(fallbackMatch[0]);
            }
        }

        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: currentPrice,
            time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
            // 這裡回傳前 10 筆作為歷史參考
            history: matches.slice(0, 10) 
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
    return new Response("Taiwan VIX Proxy is Online");
  }
};
