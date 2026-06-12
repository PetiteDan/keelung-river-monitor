export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  try {
    // 不加 elementName 篩選，先看汐止區完整結構
    const r = await fetch(
      `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-071?Authorization=${token}&locationName=汐止區&format=JSON`
    );
    const j = await r.json();
    const locs     = j?.records?.Locations?.[0]?.Location || [];
    const xizhi    = locs.find(l => l.LocationName === '汐止區') || locs[0];
    const elements = xizhi?.WeatherElement || [];

    res.status(200).json({
      http: r.status,
      location_found: xizhi?.LocationName,
      all_element_names: elements.map(e => e.ElementName),
      // 找 Wx 或天氣現象相關的
      wx_element: elements.find(e => e.ElementName === 'Wx' || e.ElementName === '天氣現象')
        ? {
            name: elements.find(e => e.ElementName === 'Wx' || e.ElementName === '天氣現象')?.ElementName,
            time0: elements.find(e => e.ElementName === 'Wx' || e.ElementName === '天氣現象')?.Time?.[0]
          }
        : '找不到 Wx',
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
