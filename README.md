# 常用水位站點監測系統

資料來源：經濟部水利署 防災資訊服務網 / 中央氣象署開放資料

## 部署步驟（Vercel + Turso + GitHub）

### 第一步：上傳到 GitHub，部署到 Vercel
將所有檔案推上 GitHub，到 vercel.com 用 GitHub 登入後 Import repo，直接 Deploy。

### 第二步：建立 Turso 資料庫
1. Vercel 專案 → **Storage** → **Turso** → **Create**
2. 輸入名稱（如 `water-monitor`），選最近的區域
3. 建立後點 **Connect to Project** → 選你的專案 → **Connect**
4. Vercel 自動注入 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN`，不需要手動填

### 第三步：設定環境變數
Vercel → **Settings** → **Environment Variables**，新增：

| 變數名稱 | 說明 |
|----------|------|
| `ADMIN_PASSWORD` | 管理員密碼，自訂 |
| `CWA_API_KEY` | 中央氣象署 API Token（opendata.cwa.gov.tw 取得）|

### 第四步：Redeploy
設定完後 **Redeploy** 一次讓環境變數生效。

首次呼叫 `/api/station` 時會自動建立資料表並寫入預設三站（江北橋、社后橋、五堵）。

---

## 功能
| 功能 | 說明 |
|------|------|
| 水位監測 | 即時水位、警戒燈號、近兩週折線圖 |
| 天氣資訊 | 汐止區即時天氣（氣象署預報）、溫濕壓、累積雨量 |
| 自動更新 | 每 10 分鐘，可切換開關 |
| 警報音效 | 超過一/二級警戒自動播放，閃爍動畫持續至恢復正常 |
| 管理站點 | 登入後從淡水河流域所有站點下拉新增，可拖曳排序 |

## 專案結構
```
├── index.html              ← 前端儀表板
├── vercel.json             ← Vercel 設定
├── package.json            ← 相依套件（@libsql/client）
└── api/
    ├── _db.js              ← Turso DB 共用模組（自動建表）
    ├── station.js          ← 水位站基本資料
    ├── realtime.js         ← 即時水位
    ├── history.js          ← 兩週歷史資料
    ├── all-stations.js     ← 淡水河流域所有站點（管理下拉）
    ├── admin.js            ← 管理 API（驗證 + 讀寫 Turso）
    ├── weather.js          ← 氣象資料
    └── weather-debug.js    ← 除錯用
```
