export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        // 使用 Google Finance 抓取台股 VIX (搜尋字串通常包含相關指數)
        // 這裡我們先示範抓取台股大盤 (TPE: TAIEX) 作為結構測試，
        // 若要精準 VIX，Google Finance 有時需使用特定代碼
        const targetUrl = "https://www.google.com/finance/quote/.VIXTW:INDEXTPE";
        
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9"
          }
        });
        
        const html = await res.text();

        // Google Finance 的價格通常在 data-last-price 屬性中
        const priceRegex = /data-last-price="([\d.]+)"/;
        const match = html.match(priceRegex);
        
        let currentPrice = 0;
        if (match && match[1]) {
          currentPrice = parseFloat(match[1]);
        } else {
          // 備用方案：尋找數值格式
          const fallbackRegex = /class="YMlKec fxKbKc">([\d.]+)</;
          const fallbackMatch = html.match(fallbackRegex);
          if (fallbackMatch) currentPrice = parseFloat(fallbackMatch[1]);
        }

        if (currentPrice === 0) {
          throw new Error("無法從資料源取得數值");
        }

        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: currentPrice,
            time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
            source: "Google Finance"
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
    return new Response("Worker Active");
  }
};
