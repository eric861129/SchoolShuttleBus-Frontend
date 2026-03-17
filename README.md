# School Shuttle Bus Frontend

康橋交通車登記系統前端專案。這是一個以手機操作為優先的 Vue 3 單頁應用，涵蓋家長 / 學生乘車登記、老師點名、管理端總覽、路線管理與營運作業。

## 線上環境

- Frontend: <https://wonderful-moss-0d3f8b800.1.azurestaticapps.net/>
- Backend API: <https://app-school-shuttlebus-demo-e9c3h5c9btdafeak.westus2-01.azurewebsites.net/>

## 功能範圍

| 角色 | 主要頁面 | 路由 |
| --- | --- | --- |
| 家長 / 學生 | 登入、每週乘車登記、本週 / 下週預覽 | `/login` `/registrations` `/schedule` |
| 老師 | 點名、路線查看與維護 | `/attendance` `/routes` |
| 管理員 | 管理總覽、路線管理、營運作業 | `/admin` `/routes` `/operations` |

目前前端已完成：

- 手機優先的 RWD 介面，支援手機、平板與桌機。
- `zh-TW` / `en-US` 雙語切換，使用 `vue-i18n` 管理共用與頁面文案。
- 登入頁快速切換 Demo 帳號、語系切換、QR Code 掃碼登入。
- 與後端 API 串接登入、乘車登記、點名、路線、通知、提醒與報表功能。
- Azure Static Web Apps SPA fallback，直接刷新前端路由不會 404。

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

## 快速開始

### 安裝

```bash
npm install
```

### 啟動開發環境

```bash
npm run dev
```

### 執行測試

```bash
npm test
```

### 建置正式版

```bash
npm run build
```

### 預覽建置結果

```bash
npm run preview
```

## 環境變數

前端預設會連到已部署的 Demo 後端。如需改接其他 API，可設定：

```bash
VITE_API_BASE_URL=https://your-api-host
```

未提供環境變數時，會使用 `src/api/config.ts` 內的預設 API 位址。

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

## 文件索引

- `README.md`
  - 專案總覽、功能範圍、快速開始、Demo 帳號。
- `docs/DEVELOPMENT.md`
  - 本機開發、目錄分工、i18n 與手機優先開發注意事項。
- `docs/DEPLOYMENT.md`
  - Azure Static Web Apps 部署流程、SPA fallback 與部署後檢查項目。

## 文件整理原則

- 根目錄只保留專案入口文件 `README.md`。
- 細節文件集中在 `docs/`。
- 文件內容以「目前已實作的前端專案」為準，不放過時規劃或已失效說明。
