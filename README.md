# 常用水位監測系統

資料來源：經濟部水利署 防災資訊服務網 Open Data API

---

## 部署步驟

### 第一步：上傳到 GitHub，部署到 Vercel
將所有檔案推上 GitHub repository，到 vercel.com 用 GitHub 登入後 Import 該 repo，直接按 Deploy。

---

### 第二步：建立 Edge Config（儲存站點清單）

1. Vercel 專案 → 上方 **Storage** → 點 **Edge Config** 旁的 **Create**
2. 輸入名稱（例如 `water-config`），按 **Create**
3. 建立後，點進去 → 右上角 **Connect to Project** → 選你的專案 → **Connect**
4. Vercel 會自動注入 `EDGE_CONFIG` 環境變數，**不需要手動填**

接著在 Edge Config 裡加入初始資料：
- 點 **Items** → **Add Item**
- Key: `station_ids`
- Value（JSON Array）: `["1140H507","1140H504","1140H502"]`
- 按 **Save**

---

### 第三步：設定環境變數

進入 Vercel 專案 → **Settings** → **Environment Variables**，新增以下三個變數：

| 變數名稱 | 說明 | 取得方式 |
|----------|------|---------|
| `ADMIN_PASSWORD` | 管理員密碼，自訂即可 | 自己設定，例如 `water2024` |
| `EDGE_CONFIG_ID` | Edge Config 的 ID | Edge Config 頁面 URL 中的 `ecfg_xxxxxxxx` 部分 |
| `VERCEL_TOKEN` | Vercel API Token | Vercel → Account Settings → **Tokens** → Create Token |

設定完後，回到 **Deployments** → **Redeploy**（重新部署一次讓變數生效）。

---

### 完成！

- 右上角「管理」按鈕 → 輸入密碼 → 新增/移除水位站 → 儲存
- 站點清單存在 Edge Config，重新整理頁面後仍保留
- 若 Edge Config 未設定，系統仍以預設三站顯示，不影響水位資料

---

## 功能說明

| 功能 | 說明 |
|------|------|
| 自動更新 | 每 10 分鐘自動更新，右上角倒數計時，可切換開關 |
| 管理站點 | 輸入密碼後可從水利署站點下拉新增，或點 ✕ 移除 |
| 警戒燈號 | 🟢 正常　🔵 三級警戒　🟡 二級警戒　🔴 一級警戒 |

## 預設監測站點

| 站名 | 站號 | 地區 |
|------|------|------|
| 江北橋 | 1140H507 | 新北汐止 |
| 社后橋 | 1140H504 | 新北汐止 |
| 五堵   | 1140H502 | 新北汐止 |

## 專案結構

```
├── index.html              ← 前端儀表板
├── vercel.json             ← Vercel 設定
└── api/
    ├── station.js          ← 水位站基本資料（讀 Edge Config）
    ├── realtime.js         ← 即時水位（讀 Edge Config）
    ├── history.js          ← 兩週歷史資料
    ├── all-stations.js     ← 水利署全部基隆河站點（供下拉）
    └── admin.js            ← 管理 API（驗證密碼、讀寫 Edge Config）
```
