export async function onRequest(context) {
  try {
    const now = new Date();
    // 取得台灣時間日期格式
    const endDate = new Date(now.getTime() + 8 * 3600000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 20 * 86400000).toISOString().split('T')[0];
    
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      return new Response(JSON.stringify({ error: "無數據" }), { status: 404 });
    }

    // 逆向搜尋第一筆有效交易資料 (處理非交易日問題)
    let idx = -1;
    for (let i = result.data.length - 1; i >= 0; i--) {
      if (parseFloat(result.data[i].close) > 0) {
        idx = i;
        break;
      }
    }

    if (idx < 1) throw new Error('No valid data');

    const latest = result.data[idx];
    const prev = result.data[idx - 1];
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
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
