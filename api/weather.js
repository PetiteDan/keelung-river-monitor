const WX_STATION = 'C0AH00';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  const toNum = v => {
    if (v == null) return null;
    const n = +v;
    if (isNaN(n) || n <= -98) return null;
    return n;
  };

  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${WX_STATION}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&CountyName=新北市&format=JSON`)
    ]);

    const wxJson   = await wxRes.json();
    const rainJson = await rainRes.json();

    // ── 氣象站 ──
    const wxSt = wxJson?.records?.Station?.[0];
    const wxEl = wxSt?.WeatherElement || {};
    // 從 debug 截圖確認：
    // wxEl.Now.AirTemperature = "23.6"（字串）
    // wxEl.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature = "24.4"
    // wxEl.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature = "22.8"
    // wxEl.Now.Precipitation = "15.0"（即時降水）
    const now    = wxEl.Now      || {};
    const daily  = wxEl.DailyExtreme || {};

    const temperature = toNum(now.AirTemperature);
    const tempMax     = toNum(daily?.DailyHigh?.TemperatureInfo?.AirTemperature);
    const tempMin     = toNum(daily?.DailyLow?.TemperatureInfo?.AirTemperature);
    const precipNow   = toNum(now.Precipitation);

    // ── 雨量站（找新北市汐止）──
    const allStations = rainJson?.records?.Station || [];
    const rainSt  = allStations.find(s => s.StationName?.includes('汐止'))
                 || allStations.find(s => s.GeoInfo?.CountyName?.includes('汐止'))
                 || null;
    const precip  = rainSt?.RainfallElement?.Precipitation || [];

    // Duration 值未知，先把全部列出
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
      rain12h:   findRain('12h','12hr','12H','720'),
      rain24h:   findRain('24h','24hr','24H','1440'),
      rain48h:   findRain('48h','48hr','48H','2880'),
      rainToday: findRain('today','Today','本日'),
      _debug: {
        wx_now_keys:   Object.keys(now),
        rain_station:  rainSt?.StationName,
        precip_all:    precip,
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
