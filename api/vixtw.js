export default async function handler(req, res) {
  try {
    const url = "https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const text = await response.text();

    // 解析 CSV
    const rows = text.split("\n").slice(1); // 跳過標題

    const data = rows
      .map(row => row.split(","))
      .filter(r => r.length > 2 && r[1]); // 過濾空值

    if (data.length < 2) {
      return res.status(200).json({
        price: 0,
        status: "無有效資料",
      });
    }

    const latest = data[data.length - 1];
    const prev = data[data.length - 2];

    const latestVIX = parseFloat(latest[1]);
    const prevVIX = parseFloat(prev[1]);

    res.status(200).json({
      price: latestVIX,
      change: latestVIX - prevVIX,
      changePct: ((latestVIX - prevVIX) / prevVIX) * 100,
      date: latest[0],
      status: "success",
    });

  } catch (error) {
    res.status(500).json({
      error: "抓取失敗",
      detail: error.message,
    });
  }
}
