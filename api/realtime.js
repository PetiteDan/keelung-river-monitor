import { get } from '@vercel/edge-config';

const DEFAULT_IDS = ['1140H507', '1140H504', '1140H502'];

async function getIdsFromEdgeConfig() {
  const ecId    = process.env.EDGE_CONFIG_ID;
  const ecToken = process.env.VERCEL_TOKEN;
  if (ecId && ecToken) {
    try {
      const r = await fetch(
        `https://api.vercel.com/v1/edge-config/${ecId}/item/station_ids`,
        { headers: { Authorization: `Bearer ${ecToken}` } }
      );
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.value) && j.value.length > 0) return j.value;
      }
    } catch (_) {}
  }
  try {
    const saved = await get('station_ids');
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (_) {}
  return DEFAULT_IDS;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const ids = await getIdsFromEdgeConfig();
    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo');
    const data = await response.json();
    const filtered = data.filter(s => ids.includes(s.StationNo));
    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
