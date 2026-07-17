import { initDb, getStationIds, setStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) return res.status(500).json({ error: '尚未設定 ADMIN_PASSWORD 環境變數' });

  await initDb();

  // GET：驗證密碼 / 取得站點清單
  if (req.method === 'GET') {
    const { password, action } = req.query;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
    if (action === 'verify') return res.status(200).json({ ok: true });

    // debug
    if (action === 'debug') {
      const ids = await getStationIds();
      return res.status(200).json({
        station_ids: ids,
        TURSO_set: !!process.env.TURSO_DATABASE_URL,
        ADMIN_PASSWORD_set: !!process.env.ADMIN_PASSWORD,
      });
    }

    const ids = await getStationIds();
    return res.status(200).json({ ids });
  }

  // POST：更新站點清單
  if (req.method === 'POST') {
    const { password, ids } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: '站點清單不可為空' });

    await setStationIds(ids);
    return res.status(200).json({ ok: true, ids });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
