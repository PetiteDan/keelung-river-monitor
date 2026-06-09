import { get } from '@vercel/edge-config';

const DEFAULT_IDS = ['1140H507', '1140H504', '1140H502'];

// 所有已知站的基本資料（Station API 找不到時的 fallback）
const STATION_FALLBACK = {
  '1140H999': { StationNo:'1140H999', StationName:'員山子', Address:'新北市瑞芳區', BasinName:'基隆河', WarningLevel1:63.0, WarningLevel2:62.5, TopLevel:67.2 },
  '1140H501': { StationNo:'1140H501', StationName:'大宜橋', Address:'基隆市七堵區', BasinName:'基隆河' },
  '1140H502': { StationNo:'1140H502', StationName:'長安橋', Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H503': { StationNo:'1140H503', StationName:'大華橋', Address:'基隆市七堵區', BasinName:'基隆河' },
  '1140H504': { StationNo:'1140H504', StationName:'社后橋', Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H505': { StationNo:'1140H505', StationName:'南湖大橋', Address:'台北市南港區', BasinName:'基隆河' },
  '1140H506': { StationNo:'1140H506', StationName:'百齡橋', Address:'台北市中山區', BasinName:'基隆河' },
  '1140H507': { StationNo:'1140H507', StationName:'江北橋', Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H508': { StationNo:'1140H508', StationName:'暖江橋', Address:'基隆市暖暖區', BasinName:'基隆河' },
  '1140H509': { StationNo:'1140H509', StationName:'碇內',   Address:'基隆市暖暖區', BasinName:'基隆河' },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    let ids = DEFAULT_IDS;
    try {
      const saved = await get('station_ids');
      if (Array.isArray(saved) && saved.length > 0) ids = saved;
    } catch (_) {}

    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data = await response.json();

    // 建立查詢 map
    const apiMap = {};
    data.forEach(s => { apiMap[s.StationNo] = s; });

    // 每個啟用的 ID：優先用 API 資料，找不到就用 fallback
    const result = ids.map(id => apiMap[id] || STATION_FALLBACK[id] || { StationNo: id, StationName: id });

    console.log('[station] ids:', ids, 'result count:', result.length);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
