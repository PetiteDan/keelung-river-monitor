// C0AH00：汐止自動站（溫度、濕度、氣壓、即時降水）
// F-D0047-029：新北市鄉鎮天氣預報，汐止區（天氣現象描述，最準確）
// C0AH00：雨量（O-A0002-001）
const XIZHI_STATION = 'C0AH00';
const FORECAST_API  = 'F-D0047-071'; // 新北市各區預報

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  const toNum = v => {
    if (v == null || v === 'X' || v === '') return null;
    if (v === 'T') return 0;
    const n = +v;
    return (isNaN(n) || n <= -98) ? null : n;
  };
  const toStr = v => {
    if (!v) return null;
    const s = String(v).trim();
    return (s === '-99' || s === '-9999' || s === 'X' || s === '-' || s === '') ? null : s;
  };

  try {
    const [obsRes, forecastRes, rainRes] = await Promise.all([
      // 汐止觀測站（溫濕壓、即時降水）
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${XIZHI_STATION}&format=JSON`),
      // 新北市汐止區鄉鎮預報（天氣現象）
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/${FORECAST_API}?Authorization=${token}&locationName=汐止區&elementName=天氣現象&format=JSON`),
      // 雨量
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${XIZHI_STATION}&format=JSON`)
    ]);

    const obsJson      = await obsRes.json();
    const forecastJson = await forecastRes.json();
    const rainJson     = await rainRes.json();

    // 觀測站資料
    const obsSt = obsJson?.records?.Station?.[0];
    const obsEl = obsSt?.WeatherElement || {};

    // 預報天氣現象：取最近一筆時段的 Wx 描述
    let weather = null;
    try {
      const locations = forecastJson?.records?.Locations?.[0]?.Location || [];
      const xizhi     = locations.find(l => l.LocationName === '汐止區') || locations[0];
      // 元素名稱是「天氣現象」，值在 ElementValue[0].Weather
      const wxElem  = xizhi?.WeatherElement?.find(e => e.ElementName === '天氣現象');
      const now     = new Date();
      const periods = wxElem?.Time || [];
      const current = periods.find(t => {
        const start = new Date(t.StartTime);
        const end   = new Date(t.EndTime);
        return now >= start && now < end;
      }) || periods[0];
      weather = toStr(current?.ElementValue?.[0]?.Weather);
    } catch (_) {}

    // 雨量
    const rainSt = rainJson?.records?.Station?.[0];
    const rainEl = rainSt?.RainfallElement || {};

    res.status(200).json({
      stationName: obsSt?.StationName || '汐止',
      obsTime:     obsSt?.ObsTime?.DateTime || null,
      weather,
      temperature: toNum(obsEl.AirTemperature),
      tempMax:     toNum(obsEl.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature),
      tempMin:     toNum(obsEl.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature),
      humidity:    toNum(obsEl.RelativeHumidity),
      pressure:    toNum(obsEl.AirPressure),
      precipNow:   toNum(obsEl.Now?.Precipitation),
      rain1h:      toNum(rainEl.Past1hr?.Precipitation),
      rain12h:     toNum(rainEl.Past12hr?.Precipitation),
      rain24h:     toNum(rainEl.Past24hr?.Precipitation),
      rain48h:     toNum(rainEl.Past2days?.Precipitation),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
