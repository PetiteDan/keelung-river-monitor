import { initDb, getStationIds } from './_db.js';

const STATION_FALLBACK = {
  '1140H999': { StationNo:'1140H999', StationName:'員山子',   Address:'新北市瑞芳區', WarningLevel1:63.0, WarningLevel2:62.5, TopLevel:67.2 },
  '1140H501': { StationNo:'1140H501', StationName:'大直橋',   Address:'基隆市七堵區' },
  '1140H502': { StationNo:'1140H502', StationName:'五堵',     Address:'新北市汐止區' },
  '1140H503': { StationNo:'1140H503', StationName:'大華橋',   Address:'基隆市七堵區' },
  '1140H504': { StationNo:'1140H504', StationName:'社后橋',   Address:'新北市汐止區' },
  '1140H505': { StationNo:'1140H505', StationName:'南湖大橋', Address:'台北市南港區' },
  '1140H506': { StationNo:'1140H506', StationName:'百齡橋',   Address:'台北市中山區' },
  '1140H507': { StationNo:'1140H507', StationName:'江北橋',   Address:'新北市汐止區' },
  '1140H508': { StationNo:'1140H508', StationName:'暖江橋',   Address:'基隆市暖暖區' },
  '1140H509': { StationNo:'1140H509', StationName:'碇內',     Address:'基隆市暖暖區' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    await initDb();

    // ?ids= 優先（前端 localStorage 快取），沒有才讀 DB
    let ids;
    const idsParam = req.query?.ids;
    if (idsParam?.trim()) {
      ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      ids = await getStationIds();
    }

    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data     = await response.json();
    const apiMap   = {};
    data.forEach(s => { apiMap[s.StationNo] = s; });

    const result = ids.map(id => apiMap[id] || STATION_FALLBACK[id] || { StationNo: id, StationName: id });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
