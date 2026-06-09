# 基隆河水位監測系統

資料來源：經濟部水利署 防災資訊服務網 Open Data API

## 部署步驟（Vercel，免費）

### 第一步：安裝 Git
前往 https://git-scm.com 下載並安裝。

### 第二步：上傳到 GitHub
1. 前往 https://github.com 註冊帳號（免費）
2. 點右上角「+」→「New repository」
3. 輸入名稱（例如 `keelung-water`），按「Create repository」
4. 照畫面上的指令把這個資料夾上傳：
   ```
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的帳號/keelung-water.git
   git push -u origin main
   ```

### 第三步：部署到 Vercel
1. 前往 https://vercel.com，用 GitHub 帳號登入
2. 點「Add New Project」
3. 選擇剛才建立的 repository
4. 直接按「Deploy」，不需要改任何設定
5. 等待約 1 分鐘，完成後會得到一個網址（例如 `keelung-water.vercel.app`）

## 專案結構

```
keelung-water-monitor/
├── index.html        ← 前端儀表板
├── vercel.json       ← Vercel 設定
└── api/
    ├── station.js    ← 水位站基本資料 proxy
    ├── realtime.js   ← 即時水位資料 proxy
    └── history.js    ← 兩週歷史資料 proxy
```

## 監測站點

| 站名 | 站號 | 地區 |
|------|------|------|
| 江北橋 | 1140H136 | 新北汐止 |
| 社后橋 | 1140H131 | 新北汐止 |
| 五堵   | 1140H502 | 新北汐止 |
| 員山子 | 1140H118 | 新北瑞芳 |
| 大華橋 | 1140H055 | 基隆七堵 |
| 暖江橋 | 1140H508 | 基隆暖暖 |

## 警戒燈號說明

- 🟢 綠色：水位正常（低於三級警戒值）
- 🔵 藍色：超過三級警戒值
- 🟡 黃色：超過二級警戒值
- 🔴 紅色：超過一級警戒值
