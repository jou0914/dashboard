export default async function handler(req, res) {
  try {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    // 擴大範圍至 30 天，確保能抓到最近交易日
    const startDate = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
    
    const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=VIXTW&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url);
    const result = await response.json();

    // 檢查是否有資料，若無資料則回傳特定狀態
    if (!result.data || result.data.length === 0) {
      return res.status(200).json({ price: 0, change: 0, status: "等待開盤" });
    }

    // 抓取最後一筆有效資料
    const latest = result.data[result.data.length - 1];
    const prev = result.data.length > 1 ? result.data[result.data.length - 2] : latest;
    
    res.status(200).json({
      price: parseFloat(latest.close),
      change: latest.close - prev.close,
      changePct: prev.close !== 0 ? ((latest.close - prev.close) / prev.close) * 100 : 0,
      date: latest.date,
      status: "success"
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
}
