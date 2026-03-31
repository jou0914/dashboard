export default async function handler(req, res) {
  try {
    const now = new Date();
    // 取得台灣時間 (UTC+8) 的日期格式
    const endDate = new Date(now.getTime() + 8 * 3600000).toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    // 關鍵修正：過濾掉數值為 0 或 null 的無效資料
    const validData = (result.data || []).filter(d => d.close && d.close > 0);

    if (validData.length < 2) {
      return res.status(200).json({ 
        price: 0, 
        change: 0, 
        status: "數據源尚未產出有效值",
        debug: "收到的有效資料筆數不足" 
      });
    }

    const latest = validData[validData.length - 1];
    const prev = validData[validData.length - 2];
    
    res.status(200).json({
      price: parseFloat(latest.close),
      change: latest.close - prev.close,
      changePct: ((latest.close - prev.close) / prev.close) * 100,
      date: latest.date,
      status: "success"
    });
  } catch (error) {
    res.status(500).json({ error: "伺服器內部錯誤" });
  }
}
