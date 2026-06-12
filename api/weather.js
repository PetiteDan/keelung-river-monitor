// C0AH00：汐止自動站（溫度、濕度、氣壓、即時降水）
// 466880：板橋有人站（天氣現象描述，自動站無此欄位）
// C0AH00：雨量（O-A0002-001）
const XIZHI_ID   = 'C0AH00';
const BANQIAO_ID = '466880';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  const toNum = v => {
    if (v == null || v === 'X' || v === '' || v === '-') return null;
    if (v === 'T') return 0;
    const n = +v;
    return (isNaN(n) || n <= -98) ? null : n;
  };
  const toStr = v => {
    if (!v) return null;
    const s = String(v).trim();
    if (!s || s === '-99' || s === '-9999' || s === 'X' || s === '-') return null;
    return s;
  };

  try {
    const [xRes, bqRes, rainRes] = await Promise.all([
      // 汐止站：溫度、濕度、氣壓、即時降水
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${XIZHI_ID}&format=JSON`),
      // 板橋站：天氣現象描述
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${BANQIAO_ID}&format=JSON`),
      // 雨量
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${XIZHI_ID}&format=JSON`)
    ]);

    const xJson    = await xRes.json();
    const bqJson   = await bqRes.json();
    const rainJson = await rainRes.json();

    const xSt  = xJson?.records?.Station?.[0];
    const xEl  = xSt?.WeatherElement || {};
    const bqSt = bqJson?.records?.Station?.[0];
    const bqEl = bqSt?.WeatherElement || {};

    // 天氣描述：優先汐止，沒有就用板橋（板橋有人工觀測）
    const weather = toStr(xEl.Weather) || toStr(bqEl.Weather);

    const rainSt = rainJson?.records?.Station?.[0];
    const rainEl = rainSt?.RainfallElement || {};

    res.status(200).json({
      stationName: xSt?.StationName || '汐止',
      obsTime:     xSt?.ObsTime?.DateTime || null,
      weather,
      temperature: toNum(xEl.AirTemperature),
      tempMax:     toNum(xEl.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature),
      tempMin:     toNum(xEl.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature),
      humidity:    toNum(xEl.RelativeHumidity),
      pressure:    toNum(xEl.AirPressure),
      precipNow:   toNum(xEl.Now?.Precipitation),
      rain1h:      toNum(rainEl.Past1hr?.Precipitation),
      rain12h:     toNum(rainEl.Past12hr?.Precipitation),
      rain24h:     toNum(rainEl.Past24hr?.Precipitation),
      rain48h:     toNum(rainEl.Past2days?.Precipitation),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
