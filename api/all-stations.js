// 從水利署撈所有基隆河水位站（StationNo 1140H5xx 系列）供管理介面下拉選單用
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data = await response.json();

    // 基隆河站點為 1140H5xx 系列（含已知的 1140H110 介壽橋）
    const KEELUNG_PREFIXES = ['1140H5'];
    const EXTRA_IDS = ['1140H110']; // 員山子段（介壽橋）

    const keelung = data.filter(s =>
      s.StationNo &&
      (KEELUNG_PREFIXES.some(p => s.StationNo.startsWith(p)) ||
       EXTRA_IDS.includes(s.StationNo))
    );

    res.status(200).json(keelung);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
