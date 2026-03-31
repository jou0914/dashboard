// api/vix.js
module.exports = async function handler(req, res) {
  // 強制設定 CORS 與 快取
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 改用 query2 有時候比 query1 穩定，並加上隨機參數防止快取
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=5d&_=${Date.now()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://finance.yahoo.com/'
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Yahoo blocked request: ${response.status}` });
    }

    const data = await response.json();
    
    // 關鍵：結構安全檢查，避免訪問 undefined
    if (!data?.chart?.result?.[0]) {
      throw new Error('Malformed data structure from Yahoo');
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const indicators = result.indicators.quote[0];
    
    // 過濾無效值並取得收盤價
    const closes = (indicators.close || []).filter(v => v !== null && v !== undefined);
    
    if (closes.length < 1) {
      throw new Error('No price data available');
    }

    const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
    const previousClose = meta.previousClose || closes[closes.length - 2] || currentPrice;
    
    const change = currentPrice - previousClose;
    const changePct = (change / previousClose) * 100;

    return res.status(200).json({
      symbol: "VIX",
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      updatedAt: new Date().toISOString(),
    });

  } catch (err) {
    // 發生錯誤時回傳 502 並帶上錯誤訊息，而不是讓 Function 直接 Crash
    console.error('VIX API Error:', err.message);
    return res.status(502).json({ 
      error: "Service Temporarily Unavailable",
      message: err.message 
    });
  }
};
