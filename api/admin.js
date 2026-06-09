// 管理 API：驗證密碼、讀取/更新站點清單（透過 Vercel Edge Config）
const DEFAULT_IDS = ['1140H507', '1140H504', '1140H502'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: '尚未設定 ADMIN_PASSWORD 環境變數' });
  }

  // GET: verify 或 get 目前站點清單
  if (req.method === 'GET') {
    const { password, action } = req.query;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
    if (action === 'verify') return res.status(200).json({ ok: true });

    try {
      const { get } = await import('@vercel/edge-config');
      const ids = await get('station_ids');
      return res.status(200).json({ ids: Array.isArray(ids) ? ids : DEFAULT_IDS });
    } catch {
      return res.status(200).json({ ids: DEFAULT_IDS });
    }
  }

  // POST: 更新站點清單（透過 Edge Config Write API）
  if (req.method === 'POST') {
    const { password, ids } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: '站點清單不可為空' });

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken  = process.env.VERCEL_TOKEN;

    if (!edgeConfigId || !vercelToken) {
      return res.status(500).json({ error: '尚未設定 EDGE_CONFIG_ID 或 VERCEL_TOKEN 環境變數' });
    }

    try {
      const patchRes = await fetch(
        `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ operation: 'upsert', key: 'station_ids', value: ids }] })
        }
      );
      if (!patchRes.ok) {
        const err = await patchRes.text();
        return res.status(500).json({ error: '寫入 Edge Config 失敗：' + err });
      }
      return res.status(200).json({ ok: true, ids });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
