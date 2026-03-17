# School Shuttle Bus Frontend

康橋交通車登記系統 Demo 前端專案。這是一個以手機操作為優先的 Vue 3 單頁應用，提供家長 / 學生的乘車登記、老師點名、管理端營運總覽、路線管理與報表 / 通知操作。

## 線上環境

- Frontend: <https://wonderful-moss-0d3f8b800.1.azurestaticapps.net/>
- Backend API: <https://app-school-shuttlebus-demo-e9c3h5c9btdafeak.westus2-01.azurewebsites.net/>

## 目前功能範圍

### 角色與頁面

| 角色 | 頁面 | 路由 |
| --- | --- | --- |
| 家長 / 學生 | 登入、每週乘車登記、本週 / 下週預覽 | `/login` `/registrations` `/schedule` |
| 老師 | 點名、路線查看與維護 | `/attendance` `/routes` |
| 管理員 | 管理總覽、路線管理、營運作業 | `/admin` `/routes` `/operations` |

### 已完成的前端能力

- 手機優先的 RWD 介面，支援手機、平板與桌機。
- `zh-TW` / `en-US` 雙語切換，使用 `vue-i18n` 管理共用文案與功能頁文字。
- Demo 登入頁支援：
  - 角色快速登入按鈕
  - 語系切換按鈕
  - QR Code 彈窗，方便面試官直接用手機掃碼操作
- 與後端 Azure App Service API 串接：
  - 登入 / refresh / logout
  - 乘車登記
  - 點名 session 與點名狀態更新
  - 路線 / 站點 / 指派老師
  - 廣播、提醒、報表下載、通知歷程
- Azure Static Web Apps SPA fallback 已配置完成，直接刷新 `/login`、`/admin` 等前端路由不會 404。

## 技術棧

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- Vue I18n
- Day.js
- QRCode
- Vitest + Testing Library
- Azure Static Web Apps

## 本機開發

### 安裝

```bash
npm install
```

### 啟動開發環境

```bash
npm run dev
```

### 測試

```bash
npm test
```

### 建置

```bash
npm run build
```

### 預覽建置結果

```bash
npm run preview
```

## 環境變數

前端 API 預設會連到已部署的 Demo 後端。如需改接其他後端，可設定：

```bash
VITE_API_BASE_URL=https://your-api-host
```

目前程式預設值位於 `src/api/config.ts`，未提供環境變數時會使用 Azure Demo API。

## Demo 帳號

登入頁提供四組 Demo 帳號快速切換，密碼皆為 `P@ssw0rd!`：

| 身分 | 帳號 |
| --- | --- |
| 管理員 | `E0001` |
| 老師 | `T0001` |
| 家長 | `0900-000-003` |
| 學生 | `S10001` |

## 專案結構

```text
src/
  api/            API contracts、HTTP client、API base config
  app/            App shell、router、navigation
  features/
    admin/        管理總覽
    attendance/   點名
    auth/         登入與 Demo 帳號流程
    operations/   廣播、提醒、報表、通知歷程
    registration/ 乘車登記與每週預覽
    routes/       路線與站點管理
    shared/       共用頁面與元件
  i18n/           多語系設定與訊息
  shared/         日期與共用工具
  stores/         Pinia session store
  test/           測試初始化
public/
  staticwebapp.config.json Azure Static Web Apps SPA fallback 設定
```

## 部署方式

本專案部署於 Azure Static Web Apps，GitHub Actions workflow 位於：

- `.github/workflows/azure-static-web-apps-wonderful-moss-0d3f8b800.yml`

部署流程：

1. Push 到 `main`
2. GitHub Actions 執行 build
3. Azure Static Web Apps 自動更新正式站

## 文件維護原則

這份 README 應反映「目前前端實作狀態」，不是產品 PRD。若未來新增頁面、調整部署方式、修改 API 連線方式或加入新的語系 / 測試流程，請同步更新本文件。
