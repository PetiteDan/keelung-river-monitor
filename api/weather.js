const STATION_ID = 'C0S520'; // 汐止

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

    // O-A0001-001 結構：records.Station[].WeatherElement 為物件（非陣列）
    const wxSt  = wxJson?.records?.Station?.[0];
    const wxEl  = wxSt?.WeatherElement || {};

    // O-A0002-001 結構：records.Station[].RainfallElement.Precipitation 陣列
    const rainSt = rainJson?.records?.Station?.[0];
    const precip = rainSt?.RainfallElement?.Precipitation || [];

    // 找各時距雨量（Duration 欄位）
    const findRain = (dur) => {
      const hit = precip.find(p => p.Duration === dur);
      return hit?.Accumulation != null ? +hit.Accumulation : null;
    };

    // DailyExtreme 有時放在不同路徑，做保險處理
    const tempMax = wxEl?.DailyExtreme?.DailyHigh?.AirTemperature != null
      ? +wxEl.DailyExtreme.DailyHigh.AirTemperature : null;
    const tempMin = wxEl?.DailyExtreme?.DailyLow?.AirTemperature != null
      ? +wxEl.DailyExtreme.DailyLow.AirTemperature : null;

    const result = {
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl?.Weather || null,
      temperature: wxEl?.AirTemperature != null ? +wxEl.AirTemperature : null,
      tempMax,
      tempMin,
      rain12h:  findRain('12hr'),
      rain24h:  findRain('24hr'),
      rain48h:  findRain('48hr'),
      rainToday: findRain('today'),
      // debug
      _raw_wx_keys:   Object.keys(wxEl),
      _raw_precip_dur: precip.map(p => p.Duration),
    };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
