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
    const wxRes  = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${WX_STATION}&format=JSON`);
    const wxJson = await wxRes.json();
    const wxSt   = wxJson?.records?.Station?.[0];
    const wxEl   = wxSt?.WeatherElement || {};

    res.status(200).json({
      stationName: wxSt?.StationName || '汐止',
      obsTime:     wxSt?.ObsTime?.DateTime || null,
      weather:     wxEl.Weather || null,
      temperature: toNum(wxEl.AirTemperature),
      tempMax:     toNum(wxEl.DailyExtreme?.DailyHigh?.TemperatureInfo?.AirTemperature),
      tempMin:     toNum(wxEl.DailyExtreme?.DailyLow?.TemperatureInfo?.AirTemperature),
      humidity:    toNum(wxEl.RelativeHumidity),
      pressure:    toNum(wxEl.AirPressure),
      precipNow:   toNum(wxEl.Now?.Precipitation),  // 即時降水量 mm/10min
      rain12h:  null,
      rain24h:  null,
      rain48h:  null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
