import { getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  try {
    const [stationIds, wxRes] = await Promise.all([
      getStationIds(),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-071?Authorization=${token}&locationName=汐止區&elementName=天氣現象&format=JSON`)
    ]);

    const wxJson   = await wxRes.json();
    const locs     = wxJson?.records?.Locations?.[0]?.Location || [];
    const xizhi    = locs.find(l => l.LocationName === '汐止區') || locs[0];
    const wxElem   = xizhi?.WeatherElement?.find(e => e.ElementName === '天氣現象');
    const time0    = wxElem?.Time?.[0];

    res.status(200).json({
      db_station_ids:   stationIds,
      wx_http:          wxRes.status,
      location_found:   xizhi?.LocationName,
      wx_element_found: !!wxElem,
      time0_start:      time0?.StartTime,
      time0_end:        time0?.EndTime,
      weather_value:    time0?.ElementValue?.[0]?.Weather,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
