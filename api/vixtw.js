// api/vixtw.js
export default async function handler(req, res) {
  try {
    // 獲取近 10 天資料以確保包含交易日
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
    
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    if (!result.data || result.data.length < 2) {
      return res.status(404).json({ error: "數據更新中或無資料" });
    }

    const latest = result.data[result.data.length - 1];
    const prev = result.data[result.data.length - 2];
    
    res.status(200).json({
      price: parseFloat(latest.close),
      change: latest.close - prev.close,
      changePct: ((latest.close - prev.close) / prev.close) * 100,
      date: latest.date
    });
  } catch (error) {
    res.status(500).json({ error: "Server Internal Error" });
  }
}
