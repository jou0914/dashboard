export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        // 改抓 Yahoo 股市的台指 VIX 頁面
        const targetUrl = "https://tw.stock.yahoo.com/quote/%5EVIXTWN";
        
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        
        const html = await res.text();

        // Yahoo 股市的價格通常會放在 Fz(32px) 或特定的價格 Class 中
        // 我們使用更寬鬆的正規表達式來抓取當前股價
        // 尋找符合 "rt-text C($c-trend-down) Fz(32px)" 或類似結構的數字
        const priceRegex = /"realtimePrice":"([\d.]+)"/;
        const match = html.match(priceRegex);
        
        let currentPrice = 0;
        if (match && match[1]) {
          currentPrice = parseFloat(match[1]);
        } else {
          // 備案：如果 JSON 格式抓不到，抓取 HTML 標籤內的數字
          const htmlPriceRegex = /Fz\(32px\)[^>]*>([\d.]+)</;
          const htmlMatch = html.match(htmlPriceRegex);
          if (htmlMatch) currentPrice = parseFloat(htmlMatch[1]);
        }

        if (currentPrice === 0) {
            throw new Error("無法從 Yahoo 取得價格資料");
        }

        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: currentPrice,
            source: "Yahoo Finance",
            time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })
          }),
          { headers: corsHeaders }
        );

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message, note: "請檢查目標網頁是否變更結構" }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }
    return new Response("VIX Monitor Worker is Online");
  }
};
