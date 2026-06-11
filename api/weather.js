const WX_STATION = 'C0AH00';  // 汐止自動氣象站（O-A0001-001）
// O-A0002-001 路徑（從官方文件確認）：
//   RainfallElement.Now.Precipitation        → 當日降水量
//   RainfallElement.Past10Min.Precipitation  → 過去10分鐘
//   RainfallElement.Past1hr.Precipitation    → 過去1小時
//   RainfallElement.Past12hr.Precipitation   → 過去12小時
//   RainfallElement.Past24hr.Precipitation   → 過去24小時
//   RainfallElement.Past2days.Precipitation  → 前1日至今

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  const toNum = v => {
    if (v == null || v === 'X') return null;
    if (v === 'T') return 0;   // 雨跡 → 0
    const n = +v;
    return (isNaN(n) || n <= -98) ? null : n;
  };

  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${WX_STATION}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${WX_STATION}&format=JSON`)
    ]);

    const wxJson   = await wxRes.json();
    const rainJson = await rainRes.json();

    // ── 氣象站 ──
    const wxSt = wxJson?.records?.Station?.[0];
    const wxEl = wxSt?.WeatherElement || {};

    // ── 雨量站（正確路徑）──
    const rainSt  = rainJson?.records?.Station?.[0];
    const rainEl  = rainSt?.RainfallElement || {};

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl.Weather     || null,
      temperature: toNum(wxEl.AirTemperature),
      tempMax:     toNum(wxEl.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature),
      tempMin:     toNum(wxEl.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature),
      humidity:    toNum(wxEl.RelativeHumidity),
      pressure:    toNum(wxEl.AirPressure),
      precipNow:   toNum(wxEl.Now?.Precipitation),
      rain1h:      toNum(rainEl.Past1hr?.Precipitation),
      rain12h:     toNum(rainEl.Past12hr?.Precipitation),
      rain24h:     toNum(rainEl.Past24hr?.Precipitation),
      rain48h:     toNum(rainEl.Past2days?.Precipitation),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
