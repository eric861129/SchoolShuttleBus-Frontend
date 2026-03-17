# Frontend Deployment Guide

本專案前端部署於 Azure Static Web Apps，正式站會由 GitHub Actions 自動部署。

## 正式站資訊

- Frontend: <https://wonderful-moss-0d3f8b800.1.azurestaticapps.net/>
- Backend API: <https://app-school-shuttlebus-demo-e9c3h5c9btdafeak.westus2-01.azurewebsites.net/>

## 部署 workflow

GitHub Actions workflow 位於：

```text
.github/workflows/azure-static-web-apps-wonderful-moss-0d3f8b800.yml
```

目前流程：

1. Push 到 `main`
2. GitHub Actions 觸發 build and deploy
3. Azure Static Web Apps 更新正式站

## Build 設定

目前 workflow 使用：

- `app_location: "/"`  
- `output_location: "dist"`

這代表正式部署會使用 Vite 建出的 `dist/` 內容。

## SPA 路由設定

前端使用 Vue Router，因此 Azure Static Web Apps 需要 SPA fallback。

設定檔位置：

```text
public/staticwebapp.config.json
```

目前規則會將非靜態資產的路徑改寫回 `/index.html`，避免直接重新整理以下頁面時出現 404：

- `/login`
- `/admin`
- `/registrations`
- `/schedule`
- `/attendance`
- `/routes`
- `/operations`

## 環境變數

前端可用以下環境變數覆寫 API：

```bash
VITE_API_BASE_URL=https://your-api-host
```

未設定時，前端會使用 `src/api/config.ts` 的預設 API 位址。

## 部署後檢查

每次部署後，建議至少檢查：

1. 首頁是否正常載入
2. `/login` 直接開啟與重新整理是否正常
3. 語系切換是否正常
4. 手機版 `/registrations` 與 `/admin` 是否沒有橫向溢出
5. API 是否能成功登入與載入資料

## 常見問題

### 重新整理路由出現 404

優先確認 `public/staticwebapp.config.json` 是否還存在，並且已跟著建置產物一起部署。

### 畫面與本機不同

優先確認：

- 是否已成功 push 到 `main`
- GitHub Actions run 是否成功
- 正式站是否已更新到最新資產

### API 串接錯誤

優先確認：

- `VITE_API_BASE_URL` 是否正確
- 後端 API 是否正常
- 前後端 contract 是否同步
