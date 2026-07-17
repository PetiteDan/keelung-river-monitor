import { getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    let ids;
    const idsParam = req.query?.ids;
    if (idsParam?.trim()) {
      ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      ids = await getStationIds();
    }

    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo');
    const data     = await response.json();
    const filtered = data.filter(s => ids.includes(s.StationNo));
    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
