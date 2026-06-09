import { get } from '@vercel/edge-config';

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

    // debug: show env status
    if (action === 'debug') {
      let ecValue = null, ecErr = null;
      try { ecValue = await get('station_ids'); } catch(e) { ecErr = e.message; }
      return res.status(200).json({
        station_ids: ecValue,
        edge_config_err: ecErr,
        EDGE_CONFIG_set: !!process.env.EDGE_CONFIG,
        EDGE_CONFIG_ID_set: !!process.env.EDGE_CONFIG_ID,
        VERCEL_TOKEN_set: !!process.env.VERCEL_TOKEN,
      });
    }

    try {
      const ids = await get('station_ids');
      return res.status(200).json({ ids: Array.isArray(ids) ? ids : DEFAULT_IDS });
    } catch {
      return res.status(200).json({ ids: DEFAULT_IDS });
    }
  }

  // POST: 更新站點清單
  if (req.method === 'POST') {
    const { password, ids } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: '密碼錯誤' });
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: '站點清單不可為空' });

    const edgeConfigId = process.env.EDGE_CONFIG_ID;
    const vercelToken  = process.env.VERCEL_TOKEN;

    if (!edgeConfigId) return res.status(500).json({ error: '尚未設定 EDGE_CONFIG_ID 環境變數。請到 Vercel → Settings → Environment Variables 新增。' });
    if (!vercelToken)  return res.status(500).json({ error: '尚未設定 VERCEL_TOKEN 環境變數。請到 Vercel → Account Settings → Tokens 建立並設定。' });

    try {
      const patchRes = await fetch(
        `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: [{ operation: 'upsert', key: 'station_ids', value: ids }]
          })
        }
      );
      const result = await patchRes.json();
      if (!patchRes.ok) {
        return res.status(500).json({
          error: `寫入 Edge Config 失敗（HTTP ${patchRes.status}）`,
          detail: result
        });
      }
      return res.status(200).json({ ok: true, ids });
    } catch (e) {
      return res.status(500).json({ error: '網路錯誤：' + e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
