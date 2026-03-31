// functions/api/vixtw.js 完整修正版
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

    // 逆向搜尋第一筆大於 0 的有效值 (處理假日顯示問題)
    let latestIndex = -1;
    for (let i = result.data.length - 1; i >= 0; i--) {
      if (result.data[i].close > 0) {
        latestIndex = i;
        break;
      }
    }

    if (latestIndex < 1) {
      return new Response(JSON.stringify({ error: "找不到有效交易日" }), { status: 404 });
    }

    const latest = result.data[latestIndex];
    const prev = result.data[latestIndex - 1];
    
    const data = {
      status: "success",
      price: parseFloat(latest.close),
      date: latest.date,
      change: latest.close - prev.close,
      changePct: ((latest.close - prev.close) / prev.close) * 100
    };

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500 });
  }
}
