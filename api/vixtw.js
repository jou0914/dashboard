export default async function handler(req, res) {
  try {
    const url = "https://www.taifex.com.tw/file/taifex/CHINESE/3/vixDaily.csv";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/csv,application/xhtml+xml",
        "Referer": "https://www.taifex.com.tw/cht/3/vix",
        "Connection": "keep-alive",
      },
    });

    let text = await response.text();

    // ❗ 如果還是 HTML → 直接回報
    if (text.includes("<HTML")) {
      return res.status(200).json({
        error: "被期交所擋了",
        hint: "需要代理或快取",
        preview: text.slice(0, 100),
      });
    }

    text = text.replace(/^\uFEFF/, "");

    const rows = text.split(/\r?\n/);

    const parsed = rows
      .slice(1)
      .map(r => r.trim())
      .filter(r => r)
      .map(r => {
        const [date, raw] = r.split(",");

        const price = parseFloat(
          (raw || "").replace(/[^0-9.]/g, "")
        );

        return { date, price };
      })
      .filter(d => d.date && d.price);

    if (parsed.length < 2) {
      return res.status(200).json({
        price: 0,
        status: "無有效資料",
        debug: parsed,
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
    res.status(200).json({
      error: "抓取失敗",
      detail: error.message,
    });
  }
}
