// 淡水河流域水位站（傳統水文站，與防災資訊服務網一致）
// 站號格式 1140H1xx，資料來源：WRA RealTimeInfo API
const TAMSUI_STATIONS = [
  // 基隆河（上游→下游）
  { StationNo:'1140H123', StationName:'員山子',   river:'基隆河', region:'新北瑞芳' },
  { StationNo:'1140H110', StationName:'介壽橋',   river:'基隆河', region:'新北瑞芳' },
  { StationNo:'1140H113', StationName:'長安橋',   river:'基隆河', region:'新北汐止' },
  { StationNo:'1140H115', StationName:'社后橋',   river:'基隆河', region:'新北汐止' },
  { StationNo:'1140H120', StationName:'江北橋',   river:'基隆河', region:'新北汐止' },
  { StationNo:'1140H116', StationName:'南湖大橋', river:'基隆河', region:'台北南港' },
  { StationNo:'1140H143', StationName:'百齡橋',   river:'基隆河', region:'台北中山' },
  // 淡水河幹流
  { StationNo:'1140H029', StationName:'台北橋',   river:'淡水河幹流', region:'台北' },
  { StationNo:'1140H083', StationName:'萬壽橋',   river:'淡水河幹流', region:'台北' },
  { StationNo:'1140H106', StationName:'建國橋',   river:'淡水河幹流', region:'新北' },
  { StationNo:'1140H107', StationName:'淡水',     river:'淡水河幹流', region:'新北' },
  // 新店溪
  { StationNo:'1140H066', StationName:'碧潭橋',   river:'新店溪', region:'新北' },
  { StationNo:'1140H052', StationName:'中正橋',   river:'新店溪', region:'台北' },
  { StationNo:'1140H039', StationName:'秀朗橋',   river:'新店溪', region:'新北' },
  { StationNo:'1140H105', StationName:'城林橋',   river:'新店溪', region:'新北' },
  // 大漢溪
  { StationNo:'1140H109', StationName:'石門',     river:'大漢溪', region:'桃園' },
  { StationNo:'1140H076', StationName:'龜山橋',   river:'大漢溪', region:'桃園' },
  { StationNo:'1140H043', StationName:'大溪橋',   river:'大漢溪', region:'桃園' },
  { StationNo:'1140H130', StationName:'柑城橋',   river:'大漢溪', region:'新北' },
  { StationNo:'1140H054', StationName:'三峽橋',   river:'大漢溪', region:'新北' },
  { StationNo:'1140H058', StationName:'新海橋',   river:'大漢溪', region:'新北' },
  // 景美溪
  { StationNo:'1140H119', StationName:'深坑中正橋', river:'景美溪', region:'新北' },
  { StationNo:'1140H082', StationName:'寶橋',     river:'景美溪', region:'台北' },
  { StationNo:'1140H108', StationName:'萬福橋',   river:'景美溪', region:'台北' },
  // 北勢溪
  { StationNo:'1140H068', StationName:'福山橋',   river:'北勢溪', region:'新北' },
  { StationNo:'1140H096', StationName:'水源橋',   river:'北勢溪', region:'新北' },
  { StationNo:'1140H099', StationName:'石碇',     river:'北勢溪', region:'新北' },
  { StationNo:'1140H098', StationName:'金瓜寮橋', river:'北勢溪', region:'新北' },
  // 南勢溪
  { StationNo:'1140H067', StationName:'烏來橋',   river:'南勢溪', region:'新北' },
  // 三峽河
  { StationNo:'1140H101', StationName:'三峽河',   river:'三峽河', region:'新北' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // 嘗試從 Station API 補警戒值
    let stMap = {};
    try {
      const stRes = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
      const stAll = await stRes.json();
      stAll.forEach(s => { stMap[s.StationNo] = s; });
    } catch (_) {}

    const result = TAMSUI_STATIONS.map(k => {
      const api = stMap[k.StationNo] || {};
      return {
        StationNo:      k.StationNo,
        StationName:    api.StationName   || k.StationName,
        Address:        k.region,
        river:          k.river,
        WarningLevel1:  api.WarningLevel1  ?? null,
        WarningLevel2:  api.WarningLevel2  ?? null,
        WarningLevel3:  api.WarningLevel3  ?? null,
        TopLevel:       api.TopLevel       ?? null,
        PlanFloodLevel: api.PlanFloodLevel ?? null,
      };
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
