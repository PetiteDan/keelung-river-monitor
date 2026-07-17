import { getStationIds } from './_db.js';

// 即時水位資料來源：
// opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=25768
// 這個 API 包含所有水文站（1140H1xx 系列），與防災資訊服務網一致
// fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo 只有部分站（不含 1140H1xx 傳統水文站）

const REALTIME_URL = 'https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=25768';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const ids = await getStationIds();

    const response = await fetch(REALTIME_URL);
    const data = await response.json();

    // 欄位對應：stationid → StationNo, waterlevel → WaterLevel, datetime → Time
    const filtered = data
      .filter(r => ids.includes(r.stationid))
      .map(r => ({
        StationNo:  r.stationid,
        WaterLevel: parseFloat(r.waterlevel),
        Time:       r.datetime,
      }));

    console.log('[realtime] ids:', ids, 'matched:', filtered.length);
    res.status(200).json(filtered);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
