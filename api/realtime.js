export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo');
    const data = await response.json();
    const IDS = ['1140H136', '1140H131', '1140H118', '1140H055', '1140H502', '1140H508'];
    const filtered = data.filter(s => IDS.includes(s.StationNo));
    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
