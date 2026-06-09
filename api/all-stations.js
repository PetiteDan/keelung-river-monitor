// 從水利署撈全部基隆河水位站，供管理介面下拉選單用
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data = await response.json();
    // 只保留基隆河相關站點（BasinName 包含基隆河，或 StationNo 1140H5xx 系列）
    const keelung = data.filter(s =>
      s.BasinName === '基隆河' ||
      (s.StationNo && s.StationNo.startsWith('1140H5'))
    );
    res.status(200).json(keelung);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
