export default async function handler(req, res) {
  try {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    // 過濾掉 close 為 0 的異常資料，並取最後兩筆有效值
    const validData = (result.data || []).filter(d => d.close > 0);

    if (validData.length < 2) {
      return res.status(200).json({ price: 0, change: 0, status: "數據源更新中" });
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
    res.status(500).json({ error: "Server Error" });
  }
}
