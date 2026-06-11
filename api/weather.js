// 氣象署 API：汐止天氣現況 + 累積雨量
// 自動氣象站 O-A0001-001 → 汐止 C0S520
// 自動雨量站 O-A0002-001 → 汐止 C0S520（同站）

const STATION_ID = 'C0S520'; // 汐止氣象站

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const token = process.env.CWA_API_KEY;
  if (!token) {
    return res.status(500).json({ error: '尚未設定 CWA_API_KEY 環境變數' });
  }

  try {
    const [wxRes, rainRes] = await Promise.all([
      // 自動氣象站：溫度、天氣現象
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${STATION_ID}&WeatherElement=Weather,AirTemperature,MaxAirTemperature,MinAirTemperature`),
      // 自動雨量站：各時距累積雨量
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${STATION_ID}`)
    ]);

    const wxData   = await wxRes.json();
    const rainData = await rainRes.json();

    // 解析氣象站資料
    const wxStation = wxData?.records?.Station?.[0];
    const wxElem    = wxStation?.WeatherElement || {};

    // 解析雨量站資料
    const rainStation = rainData?.records?.Station?.[0];
    const rainElem    = rainStation?.RainfallElement || {};

    const result = {
      stationName: wxStation?.StationName || '汐止',
      obsTime:     wxStation?.ObsTime?.DateTime || null,
      weather:     wxElem.Weather       || null,
      temperature: wxElem.AirTemperature != null ? +wxElem.AirTemperature : null,
      tempMax:     wxElem.DailyExtreme?.DailyHigh?.AirTemperature != null
                     ? +wxElem.DailyExtreme.DailyHigh.AirTemperature : null,
      tempMin:     wxElem.DailyExtreme?.DailyLow?.AirTemperature  != null
                     ? +wxElem.DailyExtreme.DailyLow.AirTemperature  : null,
      rain12h:  rainElem.Precipitation?.find(p => p.Duration === '12h')?.Accumulation   ?? null,
      rain24h:  rainElem.Precipitation?.find(p => p.Duration === '24h')?.Accumulation   ?? null,
      rain48h:  rainElem.Precipitation?.find(p => p.Duration === '48h')?.Accumulation   ?? null,
      rainToday: rainElem.Precipitation?.find(p => p.Duration === 'today')?.Accumulation ?? null,
    };

    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
