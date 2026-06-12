export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  try {
    // 完全模擬 weather.js 的請求
    const r = await fetch(
      `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-071?Authorization=${token}&locationName=汐止區&elementName=天氣現象&format=JSON`
    );
    const j = await r.json();

    const locations = j?.records?.Locations?.[0]?.Location || [];
    const xizhi     = locations.find(l => l.LocationName === '汐止區') || locations[0];
    const wxElem    = xizhi?.WeatherElement?.find(e => e.ElementName === '天氣現象');
    const time0     = wxElem?.Time?.[0];

    res.status(200).json({
      http: r.status,
      locations_count: locations.length,
      xizhi_name: xizhi?.LocationName,
      all_element_names: xizhi?.WeatherElement?.map(e => e.ElementName),
      wxElem_found: !!wxElem,
      time0_startTime: time0?.StartTime,
      time0_elementValue: time0?.ElementValue,
      weather_value: time0?.ElementValue?.[0]?.Weather,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
