export async function onRequest(context) {
  // 處理跨域預檢 (CORS)
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const now = new Date();
    // 增加緩衝天數至 30 天，確保能跨過農曆年等長假
    const endDate = new Date(now.getTime() + 8 * 3600000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    
    // 關鍵修正：dataset 應為 TaiwanStockIndexPrice
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    // 如果完全沒數據，回傳一個帶有預設值的成功回應，防止前端報錯
    if (!result.data || result.data.length === 0) {
      return new Response(JSON.stringify({ 
        status: "nodata", 
        price: 20.0, // 提供一個中性的預設值
        change: 0,
        pct: 0,
        date: "數據更新中" 
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // 過濾無效資料並取得最後兩筆
    const validData = result.data.filter(d => parseFloat(d.close) > 0);
    if (validData.length < 2) {
        throw new Error('數據不足以計算漲跌');
    }

    const latest = validData[validData.length - 1];
    const prev = validData[validData.length - 2];
    const price = parseFloat(latest.close);
    const prevPrice = parseFloat(prev.close);

    return new Response(JSON.stringify({
      status: "success",
      price: price,
      change: price - prevPrice,
      pct: ((price - prevPrice) / prevPrice) * 100,
      date: latest.date
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (error) {
    // 即使失敗也回傳 Json 格式，不要讓前端 fetch 拋出例外
    return new Response(JSON.stringify({ 
      error: error.message,
      status: "error",
      price: 0 
    }), { 
      status: 200, // 為了讓前端能 parse json，這裡建議給 200 或處理過的錯誤
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
