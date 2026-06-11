// 除錯用：直接回傳氣象署原始 JSON，確認欄位結構
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const token = process.env.CWA_API_KEY;
  if (!token) return res.status(500).json({ error: '未設定 CWA_API_KEY' });

  const STATION_ID = 'C0S520';
  try {
    const [wxRes, rainRes] = await Promise.all([
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`),
      fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0002-001?Authorization=${token}&StationId=${STATION_ID}&format=JSON`)
    ]);
    const wx   = await wxRes.json();
    const rain = await rainRes.json();

    // 精簡輸出重點欄位
    const wxSt   = wx?.records?.Station?.[0];
    const rainSt = rain?.records?.Station?.[0];
    res.status(200).json({
      wx_status:   wxRes.status,
      rain_status: rainRes.status,
      wx_station:  wxSt?.StationName,
      wx_obsTime:  wxSt?.ObsTime,
      wx_element_keys: wxSt ? Object.keys(wxSt.WeatherElement || {}) : null,
      wx_element_sample: wxSt?.WeatherElement,
      rain_element_keys: rainSt ? Object.keys(rainSt.RainfallElement || {}) : null,
      rain_precip: rainSt?.RainfallElement?.Precipitation,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
