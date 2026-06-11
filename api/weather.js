const WX_STATION = 'C0AH00';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  const toNum = v => {
    if (v == null) return null;
    const n = +v;
    return (isNaN(n) || n <= -98) ? null : n;
  };

  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${WX_STATION}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&CountyName=新北市&format=JSON`)
    ]);

    const wxJson   = await wxRes.json();
    const rainJson = await rainRes.json();

    const wxSt = wxJson?.records?.Station?.[0];
    const wxEl = wxSt?.WeatherElement || {};

    // ── 從 debug 截圖確認的正確路徑 ──
    // WeatherElement.AirTemperature = "23.6"  ← 直接在 wxEl 下，不在 Now 裡
    // WeatherElement.Now.Precipitation = "15.0"
    // WeatherElement.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature = "24.4"
    // WeatherElement.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature  = "22.8"
    const temperature = toNum(wxEl.AirTemperature);
    const tempMax     = toNum(wxEl.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature);
    const tempMin     = toNum(wxEl.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature);
    const precipNow   = toNum(wxEl.Now?.Precipitation);

    // ── 雨量：O-A0002-001 新北市，找汐止站 ──
    const allStations = rainJson?.records?.Station || [];
    const rainSt  = allStations.find(s => s.StationName?.includes('汐止')) || null;
    const precip  = rainSt?.RainfallElement?.Precipitation || [];

    const findRain = (...durs) => {
      for (const d of durs) {
        const hit = precip.find(p => String(p.Duration) === String(d));
        const v = toNum(hit?.Accumulation);
        if (v != null) return v;
      }
      return null;
    };

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl.Weather || null,
      temperature,
      tempMax,
      tempMin,
      precipNow,
      rain12h:   findRain('12h','12hr','12H'),
      rain24h:   findRain('24h','24hr','24H'),
      rain48h:   findRain('48h','48hr','48H'),
      rainToday: findRain('today','Today','本日'),
      _debug: {
        wx_el_keys:   Object.keys(wxEl),
        rain_station: rainSt?.StationName,
        precip_all:   precip,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
