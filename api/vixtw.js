export default async function handler(req, res) {
  try {
    const url = "https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    let text = await response.text();

    // 🔥 清 BOM
    text = text.replace(/^\uFEFF/, "");

    // 🔥 正確切行（支援 \r\n）
    const rows = text.split(/\r?\n/);

    // 🔥 去掉標題 + 空行
    const data = rows
      .slice(1)
      .map(row => row.trim())
      .filter(row => row.length > 0)
      .map(row => row.split(","));

    // 🔥 防呆
    const valid = data.filter(r => r.length >= 2 && !isNaN(parseFloat(r[1])));

    if (valid.length < 2) {
      return res.status(200).json({
        price: 0,
        status: "無有效資料",
        debug: valid.length,
      });
    }

    const latest = valid.at(-1);
    const prev = valid.at(-2);

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
    console.error("ERROR:", error);

    res.status(200).json({
      error: "抓取失敗",
      detail: error.message,
    });
  }
}
