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

    const rows = text.split(/\r?\n/);

    const parsed = rows
      .slice(1)
      .map(row => row.trim())
      .filter(row => row.length > 0)
      .map(row => {
        const cols = row.split(",");

        // 🔥 清掉奇怪符號
        const date = cols[0]?.trim();
        const priceRaw = cols[1]?.replace(/[^0-9.]/g, "");

        const price = parseFloat(priceRaw);

        return { date, price };
      })
      .filter(d => d.date && !isNaN(d.price) && d.price > 0);

    if (parsed.length < 2) {
      return res.status(200).json({
        price: 0,
        status: "無有效資料",
        debug: parsed, // 🔥 看實際解析結果
      });
    }

    const latest = parsed.at(-1);
    const prev = parsed.at(-2);

    res.status(200).json({
      price: latest.price,
      change: latest.price - prev.price,
      changePct: ((latest.price - prev.price) / prev.price) * 100,
      date: latest.date,
      status: "success",
    });

  } catch (error) {
    console.error(error);

    res.status(200).json({
      error: "抓取失敗",
      detail: error.message,
    });
  }
}
