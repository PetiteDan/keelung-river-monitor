import { initDb, getStationIds } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pw = req.query?.password;
  if (pw !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: '需要密碼' });

  try {
    await initDb();
    const ids = await getStationIds();

    // 也直接查 DB 確認原始值
    const { getDb } = await import('./_db.js');
    const db = getDb();
    const raw = await db.execute('SELECT * FROM station_config');

    res.status(200).json({
      station_ids: ids,
      raw_rows: raw.rows,
      TURSO_set: !!process.env.TURSO_DATABASE_URL,
      AUTH_set:  !!process.env.TURSO_AUTH_TOKEN,
    });
  } catch(e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
