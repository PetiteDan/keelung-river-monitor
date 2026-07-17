// 共用的 Turso DB 連線模組
import { createClient } from '@libsql/client';

let _client = null;

export function getDb() {
  if (_client) return _client;
  const url   = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) throw new Error('未設定 TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN');
  _client = createClient({ url, authToken: token });
  return _client;
}

// 初始化資料表（首次呼叫時自動建立）
export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS station_config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  // 若 station_ids 尚未設定，寫入預設值
  const existing = await db.execute(
    'SELECT value FROM station_config WHERE key = ?',
    ['station_ids']
  );
  if (existing.rows.length === 0) {
    await db.execute(
      'INSERT INTO station_config (key, value) VALUES (?, ?)',
      ['station_ids', JSON.stringify(['1140H507', '1140H504', '1140H502'])]
    );
  }
}

export async function getStationIds() {
  const db = getDb();
  try {
    const res = await db.execute(
      'SELECT value FROM station_config WHERE key = ?',
      ['station_ids']
    );
    if (res.rows.length > 0) {
      const ids = JSON.parse(res.rows[0].value);
      if (Array.isArray(ids) && ids.length > 0) return ids;
    }
  } catch (_) {}
  return ['1140H507', '1140H504', '1140H502'];
}

export async function setStationIds(ids) {
  const db = getDb();
  await db.execute(
    'INSERT INTO station_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['station_ids', JSON.stringify(ids)]
  );
}
