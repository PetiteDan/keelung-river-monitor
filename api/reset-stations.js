// 一次性：重設 Turso 的站點清單為正確的傳統水文站站號
// 呼叫：GET /api/reset-stations?password=你的密碼
import { getDb } from './_db.js';

const CORRECT_IDS = ['1140H120', '1140H115', '1140H113'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const pw = req.query?.password;
  if (pw !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '需要密碼' });
  }

  try {
    const db = getDb();

    // 確保資料表存在
    await db.execute(`
      CREATE TABLE IF NOT EXISTS station_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // 強制寫入正確站號
    await db.execute(
      'INSERT INTO station_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['station_ids', JSON.stringify(CORRECT_IDS)]
    );

    // 驗證寫入
    const verify = await db.execute(
      'SELECT value FROM station_config WHERE key = ?',
      ['station_ids']
    );

    res.status(200).json({
      ok: true,
      written: CORRECT_IDS,
      verified: JSON.parse(verify.rows[0].value),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
