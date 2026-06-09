import { get } from '@vercel/edge-config';

const DEFAULT_IDS = ['1140H507', '1140H504', '1140H502'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let ids = DEFAULT_IDS;
    try {
      const saved = await get('station_ids');
      if (Array.isArray(saved) && saved.length > 0) ids = saved;
    } catch (_) {}

    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data = await response.json();
    const filtered = data.filter(s => ids.includes(s.StationNo));
    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
