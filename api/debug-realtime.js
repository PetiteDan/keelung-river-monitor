import { getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pw = req.query?.password;
  if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: '需要密碼' });

  const ids = await getStationIds();
  const results = {};

  const endpoints = [
    // opendata.wra.gov.tw 新路徑
    { name: 'opendata_v1_water', url: 'https://opendata.wra.gov.tw/api/v1/WaterLevel/RealTimeInfo' },
    { name: 'opendata_v2_water', url: 'https://opendata.wra.gov.tw/api/v2/WaterLevel/RealTimeInfo' },
    { name: 'opendata_opendata_25768', url: 'https://opendata.wra.gov.tw/api/OpenData/25768?format=json' },
    { name: 'opendata_dataset_25768', url: 'https://opendata.wra.gov.tw/api/v1/dataset/25768?format=json' },
    // fhy v2
    { name: 'fhy_v2_water', url: 'https://fhy.wra.gov.tw/Api/v2/Water/RealTimeInfo' },
    // 直接下載 CSV 試試
    { name: 'opendata_csv_25768', url: 'https://opendata.wra.gov.tw/Service/OpenData.aspx?format=csv&id=25768' },
  ];

  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' },
        signal: AbortSignal.timeout(5000),
      });
      const text = await r.text();
      const isJson = text.trim().startsWith('[') || text.trim().startsWith('{');
      results[ep.name] = {
        http: r.status,
        isJson,
        len: text.length,
        preview: text.slice(0, 150),
      };
    } catch(e) {
      results[ep.name] = { error: e.message };
    }
  }

  res.status(200).json({ turso_ids: ids, results });
}
