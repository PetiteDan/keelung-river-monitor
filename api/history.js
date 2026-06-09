export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { stationId } = req.query;
  if (!stationId) return res.status(400).json({ error: 'stationId required' });

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  try {
    const url = `https://fhy.wra.gov.tw/WraApi/v1/Water/RealTimeInfo?$filter=StationNo eq '${stationId}' and Time ge datetime'${fmt(twoWeeksAgo)}T00:00:00'&$orderby=Time`;
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
