import { initDb, getStationIds } from './_db.js';

// 正確站號（傳統水文站，與防災資訊服務網資料一致）
const STATION_FALLBACK = {
  '1140H110': { StationNo:'1140H110', StationName:'介壽橋',   Address:'新北市瑞芳區', WarningLevel1:50.3, WarningLevel2:47.3 },
  '1140H113': { StationNo:'1140H113', StationName:'長安橋',   Address:'新北市汐止區', WarningLevel1:13.5, WarningLevel2:10.5 },
  '1140H115': { StationNo:'1140H115', StationName:'社后橋',   Address:'新北市汐止區', WarningLevel1:11.5, WarningLevel2:8.5 },
  '1140H116': { StationNo:'1140H116', StationName:'南湖大橋', Address:'台北市南港區', WarningLevel1:11.6, WarningLevel2:9.8, WarningLevel3:6.4 },
  '1140H120': { StationNo:'1140H120', StationName:'江北橋',   Address:'新北市汐止區', WarningLevel1:12.7, WarningLevel2:9.7 },
  '1140H123': { StationNo:'1140H123', StationName:'員山子',   Address:'新北市瑞芳區', WarningLevel1:63.0, WarningLevel2:62.5 },
  '1140H143': { StationNo:'1140H143', StationName:'百齡橋',   Address:'台北市中山區', WarningLevel1:8.8,  WarningLevel2:7.0 },
  '1140H163': { StationNo:'1140H163', StationName:'新海大橋', Address:'新北市三重區' },
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
