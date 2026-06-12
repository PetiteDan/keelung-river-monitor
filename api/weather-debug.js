export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  try {
    const r = await fetch(
      `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-071?Authorization=${token}&locationName=汐止區&elementName=Wx&format=JSON`
    );
    const j = await r.json();
    // 回傳原始結構前三層
    const locs = j?.records?.Locations;
    const loc0 = locs?.[0]?.Location?.[0];
    res.status(200).json({
      http: r.status,
      records_keys: j?.records ? Object.keys(j.records) : null,
      Locations_keys: locs?.[0] ? Object.keys(locs[0]) : null,
      Location_0_name: loc0?.LocationName,
      WeatherElement_0: loc0?.WeatherElement?.[0]?.ElementName,
      Time_0: loc0?.WeatherElement?.[0]?.Time?.[0],
      Time_1: loc0?.WeatherElement?.[0]?.Time?.[1],
      raw_sample: j?.records?.Locations?.[0]?.Location?.[0]?.WeatherElement?.[0]?.Time?.slice(0,2)
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
