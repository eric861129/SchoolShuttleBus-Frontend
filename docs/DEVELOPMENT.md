# Frontend Development Guide

本文件整理前端專案的開發方式與維護重點，目標是讓後續接手的人能快速理解目前結構與修改方式。

## 開發環境

- Node.js 與 npm
- 安裝依賴：`npm install`
- 啟動開發模式：`npm run dev`
- 執行測試：`npm test`
- 建置：`npm run build`
- 預覽建置結果：`npm run preview`

## 主要目錄分工

```text
src/
  api/            API contracts、HTTP client、API base config
  app/            AppShell、router、navigation
  features/       依功能模組切分頁面
  i18n/           語系初始化與訊息
  shared/         日期與共用工具
  stores/         Pinia session 與登入狀態
  test/           Vitest 測試初始化
public/
  staticwebapp.config.json Azure Static Web Apps 路由 fallback
```

## 功能模組說明

- `features/auth`
  - 登入頁、Demo 帳號快捷入口、QR Code 顯示。
- `features/registration`
  - 家長 / 學生乘車登記與本週 / 下週預覽。
- `features/attendance`
  - 老師 / 管理員點名流程。
- `features/routes`
  - 路線、站點與指派老師維護。
- `features/operations`
  - 廣播、提醒、報表下載、通知歷程。
- `features/admin`
  - 管理總覽首頁。

## UI / UX 維護原則

- 以手機操作為優先，再向上延伸到平板與桌機。
- 新增或調整頁面時，先確認窄螢幕下是否會出現橫向溢出。
- 共用版型樣式集中在 `src/style.css`，先沿用既有設計 token 與元件樣式。
- 角色頁面應維持一致的資訊層次：
  - Hero / 摘要
  - 主要操作區
  - 狀態訊息與輔助說明

## i18n 維護原則

- 語系由 `src/i18n/index.ts` 初始化。
- 訊息集中在 `src/i18n/messages.ts`。
- 新增畫面文案時，優先寫入 translation key，不直接在 Vue 檔中硬寫字串。
- 目前支援語系：
  - `zh-TW`
  - `en-US`

## API 串接原則

- API 型別集中在 `src/api/contracts.ts`。
- HTTP 存取封裝在 `src/api/http.ts`。
- 預設 API base URL 由 `src/api/config.ts` 提供，也可由 `VITE_API_BASE_URL` 覆寫。
- 若後端 contract 變更，請同步更新：
  - `contracts.ts`
  - 使用該 contract 的頁面
  - 必要的 i18n 或 UI 狀態

## 測試與驗證

每次調整 UI 或功能後，至少執行：

```bash
npm test
npm run build
```

如果變更涉及以下內容，建議額外手動檢查：

- 登入流程
- `/login` 重新整理
- `/admin`、`/registrations` 手機版畫面
- 語系切換
- QR Code 彈窗

## 文件維護原則

- 變更功能範圍時，優先更新 `README.md`。
- 變更開發流程、結構或共用規則時，更新本文件。
- 不保留已過時的規劃型文件，避免文件與實作脫節。
