export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  const STATION_ID = 'C0AH00';
  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`)
    ]);
    const wx   = await wxRes.json();
    const rain = await rainRes.json();
    const wxSt   = wx?.records?.Station?.[0];
    const rainSt = rain?.records?.Station?.[0];
    res.status(200).json({
      wx_http:   wxRes.status,
      rain_http: rainRes.status,
      wx_station:  wxSt?.StationName,
      wx_obsTime:  wxSt?.ObsTime,
      wx_element:  wxSt?.WeatherElement,
      rain_station: rainSt?.StationName,
      rain_precip:  rainSt?.RainfallElement?.Precipitation,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
