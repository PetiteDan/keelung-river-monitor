// 汐止自動氣象站 C0AH00
// 氣象：O-A0001-001（天氣現況、溫度、最高最低）
// 雨量：O-A0003-001（10分鐘綜觀，含累積雨量）
const STATION_ID = 'C0AH00';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`)
    ]);
    const wxJson   = await wxRes.json();
    const rainJson = await rainRes.json();

    const wxSt  = wxJson?.records?.Station?.[0];
    const wxEl  = wxSt?.WeatherElement || {};

    // 溫度路徑（從 debug 確認）：
    // 即時：wxEl.Now.AirTemperature（字串）
    // 最高：wxEl.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature
    // 最低：wxEl.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature
    const toNum = v => (v != null && v !== '-99') ? +v : null;
    const tempNow = toNum(wxEl?.Now?.AirTemperature);
    const tempMax = toNum(wxEl?.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature);
    const tempMin = toNum(wxEl?.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature);

    // 雨量：O-A0003-001 路徑
    const rainSt  = rainJson?.records?.Station?.[0];
    const rainEl  = rainSt?.WeatherElement || {};
    // O-A0003-001 雨量欄位
    const precip  = rainEl?.Now?.Precipitation;
    const r12  = toNum(rainEl?.Past12hrRainfall?.Rainfall  ?? precip?.Last12hrAccumulation);
    const r24  = toNum(rainEl?.Past24hrRainfall?.Rainfall  ?? precip?.Last24hrAccumulation);
    const r48  = toNum(rainEl?.Past2DayRainfall?.Rainfall  ?? precip?.Last48hrAccumulation);
    const rToday = toNum(rainEl?.TodayAccumulation?.Rainfall ?? precip?.TodayAccumulation);

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl?.Weather  || null,
      temperature: tempNow,
      tempMax,
      tempMin,
      rain12h:   r12,
      rain24h:   r24,
      rain48h:   r48,
      rainToday: rToday,
      // debug：保留讓你驗證
      _rain_element_keys: Object.keys(rainEl),
      _rain_now: rainEl?.Now,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
