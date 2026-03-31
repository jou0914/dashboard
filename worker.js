export default {
  async fetch(request) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8"
    };

    if (url.pathname === "/vix") {
      try {
        const targetUrl = "https://www.taifex.com.tw/cht/7/vixSummary";
        const res = await fetch(targetUrl, {
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "text/html"
          }
        });
        
        // 取得原始 HTML
        const html = await res.text();

        // --- 終極解析邏輯：區塊定位法 ---
        // 1. 先找到表格的主體區域，避免抓到網頁其他的無關數字
        const tableStart = html.indexOf('class="table_f">');
        if (tableStart === -1) throw new Error("找不到資料表格");
        
        const tableHtml = html.substring(tableStart);

        // 2. 尋找所有符合 <td class="center">...</td> 的內容
        // 台灣期交所的格式通常是：
        // <td class="center">
        //                15.40
        // </td>
        const regex = /<td class="center">[\s\n]*([\d.]+)\s*<\/td>/g;
        let matches = [];
        let m;
        
        while ((m = regex.exec(tableHtml)) !== null) {
          const val = parseFloat(m[1]);
          if (!isNaN(val) && val > 0) {
            matches.push(val);
          }
        }

        // 3. 檢查結果
        // 第一筆通常是「最新指數值」，第二筆是「變動點數」
        const currentPrice = matches.length > 0 ? matches[0] : 0;

        return new Response(
          JSON.stringify({
            type: "taiwan_vix",
            price: currentPrice,
            time: new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
            all_values: matches.slice(0, 5), // 抓出前幾筆檢查是否有抓對
            debug_info: matches.length > 0 ? "Success" : "No match found"
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
