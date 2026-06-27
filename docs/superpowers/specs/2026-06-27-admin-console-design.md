# Admin 控制台設計

日期：2026-06-27
狀態：已批准，待寫實作計畫

## 目標

把現有僅有「認證審核」一頁的 `/admin` 擴充成完整後台，涵蓋五個子系統：使用者管理、媒合管理、數據儀表板、內容管理、家教行情分析。一次建好，共用同一個 admin 殼。權限定位為**讀取 + 輕量審核**（看全部資料 + 少量審核動作），不做完整 CRUD。

## 範圍界定

- **沒有金流／訂單模型**：「訂單管理」實為案件（`JobPost`）與媒合（`Application` 狀態）管理，不是付款管理。
- **家教行情已有公開頁** [/stats](../../../src/app/stats/page.tsx)；admin 版是其加強版，共用彙總邏輯。
- 權限：讀取全部 + 輕量審核動作（停用使用者、關閉案件、刪除內容）。不含改角色、編輯使用者/案件內容等完整 CRUD。

## 方案

Server components + server actions，沿用現有 [/admin/verifications](../../../src/app/admin/verifications/page.tsx) 的寫法。零新依賴、零 API route、零 client SPA。

**否決的替代方案**
- Client SPA + API routes：多寫一層，無好處。
- AdminJS / react-admin：重依賴，且要與客製 auth + generated Prisma client 相容，得不償失。

## 架構

### Admin 殼（共用基礎設施）

- `src/app/admin/layout.tsx`（新增，server component）
  - 整區單一 `ADMIN` 權限閘：未登入 → `redirect("/login")`；登入非 admin → 顯示「此頁面僅限管理員」。
  - 版面：左側欄 `AdminNav` + 右側內容區。
  - 拿掉 `verifications/page.tsx` 裡重複的逐頁權限檢查（改由 layout 統一把關）。
- `src/components/AdminNav.tsx`（新增）
  - 側欄連結：總覽 `/admin`、使用者 `/admin/users`、媒合 `/admin/matches`、內容 `/admin/content`、行情 `/admin/market`、認證審核 `/admin/verifications`。
- [src/components/Navbar.tsx](../../../src/components/Navbar.tsx)（修改）
  - `user?.role === "ADMIN"` 時顯示「管理後台」入口連結。

### 頁面單元

每頁皆為 server component，直接查 `db`，無共享狀態，可獨立理解與測試。

1. **`src/app/admin/page.tsx` — 數據儀表板**
   - 卡片數字：使用者（依 `role` 分組）、案件（依 `JobStatus` 分組）、應徵（依 `ApplicationStatus` 分組）、待審認證數、論壇文章數、評價數。
   - 近 7 日新增：使用者、案件、應徵（以 `createdAt >= now-7d` 計數）。
   - 純讀彙總，無動作。用 `db.*.groupBy` / `count`。

2. **`src/app/admin/users/page.tsx` — 使用者管理**
   - 表格欄位：化名（`displayName ?? name`）、Email、角色、三項認證旗標（`idVerified`/`bgCheckVerified`/`eduVerified`）、註冊日、狀態（啟用/停用）。
   - 篩選：依角色（searchParams `?role=`）；搜尋：name/email 關鍵字（searchParams `?q=`）。
   - 動作：停用／復用 → `setUserDisabled(id, disabled)`。
   - 分頁：每頁 50 筆（searchParams `?page=`），避免一次撈全表。

3. **`src/app/admin/matches/page.tsx` — 媒合管理**
   - 表格欄位：標題、科目、地區、狀態（`JobStatus`）、應徵數（`_count.applications`）、已媒合老師（status=ACCEPTED 的 application 對應 tutor 化名，可能無）。
   - 篩選：依狀態（searchParams `?status=`）。
   - 動作：強制關閉案件 → `closeJob(id)`（設 `status = CLOSED`）。
   - 分頁同上。

4. **`src/app/admin/content/page.tsx` — 內容管理**
   - 三區塊：論壇文章（`ForumPost`，含 board/作者/標題/回覆數/時間）、論壇回覆（`ForumReply`）、評價（`Review`，含 rating/comment/雙方）。
   - 動作：刪除 → `deleteForumPost(id)` / `deleteForumReply(id)` / `deleteReview(id)`。
   - 每區塊各取最新 N 筆（如 50），不做全文搜尋（YAGNI；需要再加）。

5. **`src/app/admin/market/page.tsx` — 家教行情分析**
   - /stats 的加強版，共用其彙總 helper（必要時把 avg/分組邏輯抽到 `src/lib/estimate.ts` 或就近共用）。
   - 維度：依科目、依學制、依地區的時薪 avg/min/max；供需對比（老師 `hourlyRate` vs 家長 `JobPost.budget`）。
   - admin 特權：納入**未上架**（`isPublished=false`）老師，公開頁不含。
   - 純讀。

### Server actions

擴充既有 `src/app/admin/actions.ts`，全部沿用既有 `requireAdmin()` 守門，動作後 `revalidatePath` 對應頁。

- `setUserDisabled(id: string, disabled: boolean)` → 更新 `User.disabled`。
- `closeJob(id: string)` → `JobPost.status = CLOSED`。
- `deleteForumPost(id: string)` → 刪文（回覆由 schema `onDelete: Cascade` 連帶刪）。
- `deleteForumReply(id: string)` → 刪回覆。
- `deleteReview(id: string)` → 刪評價。
- 既有 `approveVerification` / `rejectVerification` 不動。

### Schema 變更

[prisma/schema.prisma](../../../prisma/schema.prisma) 的 `User` 加一欄：

```prisma
disabled Boolean @default(false) // admin 停用帳號
```

需跑一次 migration。

### 登入閘

[src/auth.ts](../../../src/auth.ts) 驗證流程加一個檢查：`disabled === true` 的帳號不得登入（與密碼錯誤同樣回一般失敗訊息，不洩漏帳號狀態）。

## 錯誤處理

- 所有 action 先過 `requireAdmin()`，非 admin 直接 `return`（沿用現有模式）。
- 目標不存在或狀態不符（如關閉一個已關閉案件）→ 靜默 return，不丟例外。
- 停用帳號登入 → 回一般登入失敗。

## 測試

- `setUserDisabled` 後該帳號無法登入：一個 `assert` 自檢（停用→登入應失敗；復用→可登入）。
- 行情彙總 avg/min/max：對固定小資料集的單元自檢（沿用 /stats 既有 `avg` 邏輯，新增 region 維度時補一個 case）。
- 其餘為直接的 Prisma 讀寫，不另立框架。

## 動到的檔案

新增：`admin/layout.tsx`、`admin/page.tsx`、`admin/users/page.tsx`、`admin/matches/page.tsx`、`admin/content/page.tsx`、`admin/market/page.tsx`、`components/AdminNav.tsx`。
修改：`admin/actions.ts`、`admin/verifications/page.tsx`（移除逐頁權限閘）、`components/Navbar.tsx`、`prisma/schema.prisma`、`auth.ts`。
