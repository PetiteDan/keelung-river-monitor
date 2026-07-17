import { getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pw = req.query?.password;
  if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: '需要密碼' });

  const ids = await getStationIds();
  const results = {};

  // 測試多個 API 端點
  const endpoints = [
    {
      name: 'opendata_wra_json',
      url: 'https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=25768',
    },
    {
      name: 'ntpc_e_all',
      url: 'https://e.ntpc.gov.tw/api/v1/waterLevelStations',
    },
    {
      name: 'ntpc_e_single',
      url: 'https://e.ntpc.gov.tw/api/v1/waterLevelStations/1140H120',
    },
    {
      name: 'ntpc_data_water',
      url: 'https://data.ntpc.gov.tw/api/datasets/9c5ef699-60e6-4a6a-9843-a3c39c0ef81c/json?page=0&size=5',
    },
    {
      name: 'fhy_wra_v1',
      url: 'https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo',
    },
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://e.ntpc.gov.tw/',
        },
        signal: AbortSignal.timeout(6000),
      });
      const text = await r.text();
      const isJson = text.trim().startsWith('[') || text.trim().startsWith('{');
      results[ep.name] = {
        http: r.status,
        isJson,
        preview: text.slice(0, 200),
      };
    } catch(e) {
      results[ep.name] = { error: e.message };
    }
  }

  res.status(200).json({ turso_ids: ids, results });
}
