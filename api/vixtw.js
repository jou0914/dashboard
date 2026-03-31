export default async function handler(req, res) {
  try {
    const url = "https://www.taifex.com.tw/cht/3/vixData";

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    });

    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return res.status(200).json({
        price: 0,
        status: "無資料",
      });
    }

    const latest = data.data[data.data.length - 1];

    res.status(200).json({
      price: Number(latest.TVIX),
      date: latest.Date,
      status: "success",
    });

  } catch (error) {
    res.status(500).json({
      error: "抓取失敗",
      detail: error.message,
    });
  }
}
