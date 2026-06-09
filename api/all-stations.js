// 從 RealTimeInfo 取得所有即時資料站號，再交叉比對 Station API 補基本資料
// 篩選範圍：1140H5xx 系列（基隆河）+ 已知的 1140H110（員山子段）
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const [rtRes, stRes] = await Promise.all([
      fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo'),
      fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station')
    ]);
    const rtAll  = await rtRes.json();
    const stAll  = await stRes.json();

    // Station API → 以 StationNo 建立查詢 map
    const stMap = {};
    stAll.forEach(s => { stMap[s.StationNo] = s; });

    // 篩選基隆河站號
    const PREFIXES  = ['1140H5'];
    const EXTRA_IDS = ['1140H110'];

    const keelungRt = rtAll.filter(r =>
      r.StationNo &&
      (PREFIXES.some(p => r.StationNo.startsWith(p)) || EXTRA_IDS.includes(r.StationNo))
    );

    // 合併：有 Station 資料就用，沒有就用 StationNo 當名稱
    const result = keelungRt.map(r => {
      const s = stMap[r.StationNo];
      return s
        ? s
        : { StationNo: r.StationNo, StationName: r.StationNo, BasinName: '基隆河' };
    });

    // 依站號排序
    result.sort((a, b) => a.StationNo.localeCompare(b.StationNo));
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
