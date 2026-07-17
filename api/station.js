import { initDb, getStationIds } from './_db.js';

// 站號找不到時的備用資料
const STATION_FALLBACK = {
  '1140H110': { StationNo:'1140H110', StationName:'介壽橋',   Address:'新北市瑞芳區', WarningLevel1:50.3, WarningLevel2:47.3 },
  '1140H113': { StationNo:'1140H113', StationName:'長安橋',   Address:'新北市汐止區', WarningLevel1:13.5, WarningLevel2:10.5 },
  '1140H115': { StationNo:'1140H115', StationName:'社后橋',   Address:'新北市汐止區', WarningLevel1:11.5, WarningLevel2:8.5  },
  '1140H116': { StationNo:'1140H116', StationName:'南湖大橋', Address:'台北市南港區', WarningLevel1:11.6, WarningLevel2:9.8, WarningLevel3:6.4 },
  '1140H120': { StationNo:'1140H120', StationName:'江北橋',   Address:'新北市汐止區', WarningLevel1:12.7, WarningLevel2:9.7 },
  '1140H123': { StationNo:'1140H123', StationName:'員山子',   Address:'新北市瑞芳區', WarningLevel1:63.0, WarningLevel2:62.5 },
  '1140H143': { StationNo:'1140H143', StationName:'百齡橋',   Address:'台北市中山區', WarningLevel1:8.8,  WarningLevel2:7.0  },
  '1140H163': { StationNo:'1140H163', StationName:'新海大橋', Address:'新北市三重區' },
  // 其他常用站
  '1140H029': { StationNo:'1140H029', StationName:'台北橋',   Address:'台北市大同區' },
  '1140H039': { StationNo:'1140H039', StationName:'秀朗橋',   Address:'新北市永和區' },
  '1140H052': { StationNo:'1140H052', StationName:'中正橋',   Address:'台北市文山區' },
  '1140H054': { StationNo:'1140H054', StationName:'三峽橋',   Address:'新北市三峽區' },
  '1140H058': { StationNo:'1140H058', StationName:'新海橋',   Address:'新北市板橋區' },
  '1140H066': { StationNo:'1140H066', StationName:'碧潭橋',   Address:'新北市新店區' },
  '1140H067': { StationNo:'1140H067', StationName:'烏來橋',   Address:'新北市烏來區' },
  '1140H068': { StationNo:'1140H068', StationName:'福山橋',   Address:'新北市烏來區' },
  '1140H076': { StationNo:'1140H076', StationName:'龜山橋',   Address:'桃園市龜山區' },
  '1140H082': { StationNo:'1140H082', StationName:'寶橋',     Address:'台北市文山區' },
  '1140H083': { StationNo:'1140H083', StationName:'萬壽橋',   Address:'台北市士林區' },
  '1140H096': { StationNo:'1140H096', StationName:'水源橋',   Address:'新北市坪林區' },
  '1140H099': { StationNo:'1140H099', StationName:'石碇',     Address:'新北市石碇區' },
  '1140H101': { StationNo:'1140H101', StationName:'三峽河',   Address:'新北市三峽區' },
  '1140H105': { StationNo:'1140H105', StationName:'城林橋',   Address:'新北市新店區' },
  '1140H106': { StationNo:'1140H106', StationName:'建國橋',   Address:'新北市板橋區' },
  '1140H107': { StationNo:'1140H107', StationName:'淡水',     Address:'新北市淡水區' },
  '1140H108': { StationNo:'1140H108', StationName:'萬福橋',   Address:'台北市文山區' },
  '1140H109': { StationNo:'1140H109', StationName:'石門',     Address:'桃園市大溪區' },
  '1140H119': { StationNo:'1140H119', StationName:'深坑中正橋', Address:'新北市深坑區' },
  '1140H130': { StationNo:'1140H130', StationName:'柑城橋',   Address:'新北市三峽區' },
  '1140H043': { StationNo:'1140H043', StationName:'大溪橋',   Address:'桃園市大溪區' },
  '1140H098': { StationNo:'1140H098', StationName:'金瓜寮橋', Address:'新北市坪林區' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    await initDb();
    const ids = await getStationIds();

    // 從水利署 Station API 取得警戒值等資料
    let apiMap = {};
    try {
      const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
      const data = await response.json();
      data.forEach(s => { apiMap[s.StationNo] = s; });
    } catch (_) {}

    // 依 ids 順序回傳，優先用 API 資料，找不到用 FALLBACK
    const result = ids.map(id =>
      apiMap[id] || STATION_FALLBACK[id] || { StationNo: id, StationName: id, Address: '' }
    );

    console.log('[station] ids from Turso:', ids, 'result:', result.length);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
