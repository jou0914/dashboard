export async function onRequest(context) {
  try {
    const now = new Date();
    // 取得台灣時間並增加搜尋範圍至 30 天以跨越假日
    const endDate = new Date(now.getTime() + 8 * 3600000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    
    // 關鍵修正：VIXTW 屬於 Index 類別
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockIndexPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`FinMind API 回傳錯誤: ${response.status}`);
    
    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      return new Response(JSON.stringify({ error: "FinMind 無 VIXTW 數據", url: url }), { 
        status: 404, 
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
      });
    }

    const validData = result.data.filter(d => parseFloat(d.close) > 0);
    const latest = validData[validData.length - 1];
    const prev = validData[validData.length - 2];
    const price = parseFloat(latest.close);

    return new Response(JSON.stringify({
      status: "success",
      price: price,
      date: latest.date,
      debug_info: { count: result.data.length, last_date: latest.date }
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
}
