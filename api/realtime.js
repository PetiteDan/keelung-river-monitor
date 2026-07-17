import { getStationIds } from './_db.js';

// 嘗試多個 API 來源，找到能用的
const APIS = [
  // opendata.wra.gov.tw - 傳統水文站，有 1140H1xx
  {
    url: 'https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=25768',
    parse: (data) => data.map(r => ({
      StationNo: r.stationid,
      WaterLevel: parseFloat(r.waterlevel),
      Time: r.datetime,
    })),
  },
  // fhy.wra.gov.tw - IoT 站，只有部分 1140H1xx
  {
    url: 'https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo',
    parse: (data) => data.map(r => ({
      StationNo: r.StationNo,
      WaterLevel: parseFloat(r.WaterLevel),
      Time: r.Time,
    })),
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const ids = await getStationIds();

  // 依序嘗試各 API
  for (const api of APIS) {
    try {
      const response = await fetch(api.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://fhy.wra.gov.tw/',
        },
        signal: AbortSignal.timeout(8000),
      });

      const text = await response.text();
      // 確認是 JSON 不是 HTML
      if (text.trim().startsWith('<')) {
        console.log(`[realtime] ${api.url} returned HTML, skipping`);
        continue;
      }

      const data = JSON.parse(text);
      const parsed = api.parse(data);
      const filtered = parsed.filter(r =>
        ids.includes(r.StationNo) &&
        r.WaterLevel != null &&
        !isNaN(r.WaterLevel) &&
        r.WaterLevel > -999
      );

      if (filtered.length > 0) {
        console.log(`[realtime] success from ${api.url}, matched ${filtered.length}/${ids.length}`);
        return res.status(200).json(filtered);
      }
      console.log(`[realtime] ${api.url} matched 0 stations, trying next`);
    } catch (e) {
      console.log(`[realtime] ${api.url} error: ${e.message}`);
    }
  }

  // 全部失敗
  res.status(200).json([]);
}
