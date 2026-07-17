import { getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pw = req.query?.password;
  if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: '需要密碼' });

  try {
    const ids = await getStationIds();

    // 測試兩個 API
    const [r1, r2] = await Promise.all([
      fetch('https://opendata.wra.gov.tw/Service/OpenData.aspx?format=json&id=25768'),
      fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo')
    ]);

    const d1 = await r1.json();
    const d2 = await r2.json();

    // 用 ids 過濾兩個來源
    const from_opendata = d1.filter(r => ids.includes(r.stationid))
      .map(r => ({ id: r.stationid, wl: r.waterlevel, time: r.datetime }));

    const from_wra = d2.filter(r => ids.includes(r.StationNo))
      .map(r => ({ id: r.StationNo, wl: r.WaterLevel, time: r.Time }));

    // 也看 1140H5xx 是否還在某處
    const old_ids = ['1140H507','1140H504','1140H502'];
    const old_from_wra = d2.filter(r => old_ids.includes(r.StationNo))
      .map(r => ({ id: r.StationNo, wl: r.WaterLevel, time: r.Time }));

    res.status(200).json({
      turso_ids: ids,
      opendata_http: r1.status,
      wra_http: r2.status,
      matched_from_opendata: from_opendata,
      matched_from_wra: matched_from_wra,
      old_ids_from_wra: old_from_wra,
    });
  } catch(e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
