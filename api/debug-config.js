// 暫時用來確認 Edge Config 是否正確設定
// 訪問 /api/debug-config?password=你的密碼 來查看
import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { password } = req.query;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '需要密碼' });
  }
  try {
    const station_ids = await get('station_ids');
    res.status(200).json({
      station_ids,
      EDGE_CONFIG_set: !!process.env.EDGE_CONFIG,
      EDGE_CONFIG_ID_set: !!process.env.EDGE_CONFIG_ID,
      VERCEL_TOKEN_set: !!process.env.VERCEL_TOKEN,
      ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
    });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
