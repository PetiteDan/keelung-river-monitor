import { get } from '@vercel/edge-config';

const DEFAULT_IDS = ['1140H507', '1140H504', '1140H502'];

const STATION_FALLBACK = {
  '1140H999': { StationNo:'1140H999', StationName:'員山子',   Address:'新北市瑞芳區', BasinName:'基隆河', WarningLevel1:63.0, WarningLevel2:62.5, TopLevel:67.2 },
  '1140H501': { StationNo:'1140H501', StationName:'大直橋',   Address:'基隆市七堵區', BasinName:'基隆河' },
  '1140H502': { StationNo:'1140H502', StationName:'五堵',     Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H503': { StationNo:'1140H503', StationName:'大華橋',   Address:'基隆市七堵區', BasinName:'基隆河' },
  '1140H504': { StationNo:'1140H504', StationName:'社后橋',   Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H505': { StationNo:'1140H505', StationName:'南湖大橋', Address:'台北市南港區', BasinName:'基隆河' },
  '1140H506': { StationNo:'1140H506', StationName:'百齡橋',   Address:'台北市中山區', BasinName:'基隆河' },
  '1140H507': { StationNo:'1140H507', StationName:'江北橋',   Address:'新北市汐止區', BasinName:'基隆河' },
  '1140H508': { StationNo:'1140H508', StationName:'暖江橋',   Address:'基隆市暖暖區', BasinName:'基隆河' },
  '1140H509': { StationNo:'1140H509', StationName:'碇內',     Address:'基隆市暖暖區', BasinName:'基隆河' },
};

async function getIdsFromEdgeConfig() {
  // 同時用 REST API 和 SDK，取最新的那個
  const ecId    = process.env.EDGE_CONFIG_ID;
  const ecToken = process.env.VERCEL_TOKEN;

  let restIds = null;
  if (ecId && ecToken) {
    try {
      const r = await fetch(
        `https://api.vercel.com/v1/edge-config/${ecId}/item/station_ids`,
        {
          headers: { Authorization: `Bearer ${ecToken}` },
          cache: 'no-store'
        }
      );
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.value) && j.value.length > 0) restIds = j.value;
      }
    } catch (_) {}
  }
  if (restIds) return restIds;

  try {
    const saved = await get('station_ids');
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (_) {}
  return DEFAULT_IDS;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 不快取此回應
  res.setHeader('Cache-Control', 'no-store');
  try {
    const ids = await getIdsFromEdgeConfig();
    const response = await fetch('https://fhy.wra.gov.tw/WraApi/v1/Water/Station');
    const data = await response.json();
    const apiMap = {};
    data.forEach(s => { apiMap[s.StationNo] = s; });
    // 依 ids 順序回傳，找不到就用 fallback
    const result = ids.map(id => apiMap[id] || STATION_FALLBACK[id] || { StationNo: id, StationName: id });
    console.log('[station] ids:', ids, 'result:', result.length);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
