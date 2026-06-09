// 已知基隆河所有水位站（hardcoded 站名 + 從 API 補警戒值）
const KNOWN_STATIONS = [
  { StationNo: '1140H501', StationName: '大宜橋',   region: '基隆七堵' },
  { StationNo: '1140H502', StationName: '長安橋',   region: '新北汐止' },
  { StationNo: '1140H503', StationName: '大華橋',   region: '基隆七堵' },
  { StationNo: '1140H504', StationName: '社后橋',   region: '新北汐止' },
  { StationNo: '1140H505', StationName: '南湖大橋', region: '台北南港' },
  { StationNo: '1140H506', StationName: '百齡橋',   region: '台北中山' },
  { StationNo: '1140H507', StationName: '江北橋',   region: '新北汐止' },
  { StationNo: '1140H508', StationName: '暖江橋',   region: '基隆暖暖' },
  { StationNo: '1140H509', StationName: '碇內',     region: '基隆暖暖' },
  { StationNo: '1140H110', StationName: '介壽橋',   region: '新北瑞芳' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // 嘗試從 Station API 補警戒值，失敗也沒關係
    let stMap = {};
    try {
      const stRes = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
      const stAll = await stRes.json();
      stAll.forEach(s => { stMap[s.StationNo] = s; });
    } catch (_) {}

    const result = KNOWN_STATIONS.map(k => {
      const api = stMap[k.StationNo] || {};
      return {
        StationNo: k.StationNo,
        StationName: api.StationName || k.StationName,
        Address: api.Address || k.region,
        WarningLevel1: api.WarningLevel1 ?? null,
        WarningLevel2: api.WarningLevel2 ?? null,
        WarningLevel3: api.WarningLevel3 ?? null,
        TopLevel: api.TopLevel ?? null,
        PlanFloodLevel: api.PlanFloodLevel ?? null,
      };
    });

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
