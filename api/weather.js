// 汐止氣象站：C0AH00（新北市汐止區，O-A0001-001）
// 汐止雨量站：C0AH00（同站，O-A0002-001）
const STATION_ID = 'C0AH00';

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

    const wxSt   = wxJson?.records?.Station?.[0];
    const wxEl   = wxSt?.WeatherElement || {};
    const rainSt = rainJson?.records?.Station?.[0];
    const precip = rainSt?.RainfallElement?.Precipitation || [];

    // Duration 值可能是 '12h' 或 '12hr'，兩種都試
    const findRain = (...durs) => {
      for (const dur of durs) {
        const hit = precip.find(p => p.Duration === dur);
        if (hit?.Accumulation != null) return +hit.Accumulation;
      }
      return null;
    };

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl?.Weather           || null,
      temperature: wxEl?.AirTemperature    != null ? +wxEl.AirTemperature : null,
      tempMax:     wxEl?.DailyExtreme?.DailyHigh?.AirTemperature != null
                     ? +wxEl.DailyExtreme.DailyHigh.AirTemperature : null,
      tempMin:     wxEl?.DailyExtreme?.DailyLow?.AirTemperature != null
                     ? +wxEl.DailyExtreme.DailyLow.AirTemperature : null,
      rain12h:  findRain('12h','12hr'),
      rain24h:  findRain('24h','24hr'),
      rain48h:  findRain('48h','48hr'),
      rainToday: findRain('today','本日'),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
