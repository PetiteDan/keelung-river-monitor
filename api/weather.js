const STATION_ID = 'C0AH00'; // 新北汐止

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '尚未設定 CWA_API_KEY' });

  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`)
    ]);
    const wxJson   = await wxRes.json();
    const rainJson = await rainRes.json();

    const wxSt  = wxJson?.records?.Station?.[0];
    const wxEl  = wxSt?.WeatherElement || {};

    // 正確路徑（根據 debug 回傳）:
    // 即時溫度：wxEl.Now.AirTemperature
    // 今日最高：wxEl.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature
    // 今日最低：wxEl.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature
    const tempNow = wxEl?.Now?.AirTemperature != null ? +wxEl.Now.AirTemperature : null;
    const tempMax = wxEl?.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature != null
      ? +wxEl.DailyExtreme.DailyHigh.TemperatureInfo.AirTemperature : null;
    const tempMin = wxEl?.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature != null
      ? +wxEl.DailyExtreme.DailyLow.TemperatureInfo.AirTemperature : null;

    // 雨量：O-A0002-001
    const rainSt = rainJson?.records?.Station?.[0];
    const precip = rainSt?.RainfallElement?.Precipitation || [];

    // 列出所有 Duration 值供 debug，同時嘗試各種可能格式
    const findRain = (...durs) => {
      for (const dur of durs) {
        const hit = precip.find(p => String(p.Duration) === String(dur));
        if (hit?.Accumulation != null && hit.Accumulation !== '-99') {
          return +hit.Accumulation;
        }
      }
      return null;
    };

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl?.Weather || null,
      temperature: tempNow,
      tempMax,
      tempMin,
      rain12h:   findRain('12h', '12hr', 12),
      rain24h:   findRain('24h', '24hr', 24),
      rain48h:   findRain('48h', '48hr', 48),
      rainToday: findRain('today', 'Today', '本日累積'),
      // debug：把所有雨量資料一起回傳，方便確認 Duration 格式
      _precip_all: precip,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
