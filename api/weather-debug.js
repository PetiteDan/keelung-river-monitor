export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  // 試多個汐止雨量站號
  const RAIN_IDS = ['C0AH00', 'C1AH00', 'C0AH10', '467490'];
  const WX_ID = 'C0AH00';

  try {
    const results = {};

    // 氣象站完整 element
    const wxRes = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${WX_ID}&format=JSON`);
    const wxJson = await wxRes.json();
    const wxSt = wxJson?.records?.Station?.[0];
    results.wx = {
      StationName: wxSt?.StationName,
      ObsTime: wxSt?.ObsTime,
      WeatherElement: wxSt?.WeatherElement,
    };

    // 試每個雨量站
    for (const id of RAIN_IDS) {
      const r = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${id}&format=JSON`);
      const j = await r.json();
      const st = j?.records?.Station?.[0];
      results[`rain_${id}`] = {
        http: r.status,
        StationName: st?.StationName,
        Precipitation: st?.RainfallElement?.Precipitation,
      };
    }

    res.status(200).json(results);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
