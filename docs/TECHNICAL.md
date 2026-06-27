# TutorMatch 技術文件

家教媒合平台。學生／家長發布需求、老師應徵；雙方可私訊、互評，平台提供安全認證審核與討論區。

---

## 1. 技術棧

| 層 | 技術 |
|---|---|
| 框架 | Next.js 16（App Router、React Server Components、Server Actions） |
| 前端 | React 19、Tailwind CSS v4、react-hook-form + @hookform/resolvers |
| 認證 | NextAuth v5（Auth.js）Credentials provider、JWT session |
| 資料庫 | PostgreSQL + Prisma 6（client 輸出在 `src/generated/prisma`） |
| 驗證 | Zod（`src/lib/validations.ts`） |
| 密碼 | bcryptjs（cost 10） |

> ⚠️ 這是 Next.js 16，慣例與舊版不同。最明顯：middleware 改名為 **`proxy.ts`**（見 `src/proxy.ts`）。改框架相關行為前請先看 `node_modules/next/dist/docs/`。

---

## 2. 專案結構

```
src/
  auth.ts            NextAuth 主設定（Credentials provider、bcrypt 驗證）
  auth.config.ts     Edge-safe 設定（route 保護 callback，不含 bcrypt/Prisma）
  proxy.ts           Next 16 middleware：未登入導向 /login
  lib/
    db.ts            PrismaClient 單例
    validations.ts   Zod schema（註冊/登入/檔案/案件/應徵）
    rate-limit.ts    Postgres 固定視窗速率限制
    user.ts          顯示名稱遮罩（本名不外露）
    match.ts / estimate.ts / forum.ts / constants.ts
  app/
    (auth)/          註冊、登入（actions.ts）
    dashboard/       老師檔案、帳號與安全、我的案件/應徵
    jobs/            案件列表、發布、詳情、媒合
    tutors/          老師列表、詳情
    messages/        一對一聊天
    forum/           討論區（老師板 / 家長板）
    favorites/       收藏
    admin/           認證審核（限 ADMIN）
    u/[id]/          公開個人檔案 + 評價
    api/auth/[...nextauth]/  NextAuth route handler
  components/        UI 元件（表單、卡片、Avatar…）
prisma/
  schema.prisma      資料模型
  migrations/        遷移檔
  seed.ts            示範資料（僅限本機/測試，勿在正式環境執行）
```

---

## 3. 資料模型（Prisma）

核心實體與關係（完整定義見 `prisma/schema.prisma`）：

- **User** — 帳號。`role`（STUDENT/TUTOR/ADMIN）、`name`（本名，不公開）、`displayName`（公開化名）、`passwordHash`、認證旗標（`idVerified`/`bgCheckVerified`/`eduVerified`）。
- **TutorProfile** — 老師檔案（1:1 User）。科目/學制/地區/時薪/履歷/`isPublished`/評分統計。
- **JobPost** — 學生需求案件。`status`（OPEN/MATCHED/CLOSED）。
- **Application** — 老師對案件的應徵。`status`（PENDING/ACCEPTED/REJECTED）；`@@unique([jobId, tutorId])` 防重複應徵。
- **Conversation / Message** — 一對一聊天；`userAId < userBId` 保證配對唯一。
- **Review** — 雙向評價；`@@unique([revieweeId, authorId])` 每人對同一對象限評一次。
- **Favorite** — 收藏老師卡或案件卡。
- **VerificationRequest** — 證件審核申請。`docUrl` 為證件影像（**審核後即清空**，見第 5 節）。
- **ForumPost / ForumReply** — 討論區，支援匿名。
- **RateLimit** — 速率限制計數（key / count / expiresAt）。

列舉：`Role`、`JobStatus`、`ApplicationStatus`、`TeachingMode`、`Gender`、`VerificationType`、`VerificationStatus`、`ForumBoard`。

---

## 4. 認證與授權

**認證**：Credentials provider（`src/auth.ts`），Zod 驗證 → 查 User → `bcrypt.compare`。Session 用 JWT，token 帶 `id` 與 `role`。

**授權採雙層**：

1. **路由層（`src/proxy.ts` + `auth.config.ts` 的 `authorized`）**：`/dashboard`、`/jobs/new`、`/admin`、`/messages` 需登入。這只擋「有沒有登入」，**不分角色**。
2. **動作層（每個 Server Action / 頁面）**：真正的權限在這裡——
   - 取 `session = await auth()`，未登入直接擋。
   - 資源操作驗證擁有權（IDOR 防護），例如：只有對話雙方能送訊息、只有案件學生能接受應徵、只有被媒合過的雙方能互評。
   - 管理功能驗 `role === "ADMIN"`（`src/app/admin/actions.ts` 的 `requireAdmin()`、`admin/verifications` 頁面）。

> 設計原則：**不依賴路由層做授權**。Next.js 官方安全建議也是「在每個 action 內驗證」。註冊 schema 的 role 只允許 STUDENT/TUTOR，無法自行註冊成 ADMIN。

---

## 5. 安全設計（已實作）

| 項目 | 作法 | 位置 |
|---|---|---|
| 密碼 | bcrypt cost 10，DB 只存 hash | `src/auth.ts`, `(auth)/actions.ts` |
| 輸入驗證 | Zod schema 全面驗證 | `src/lib/validations.ts` |
| SQL injection | 全程 Prisma 參數化查詢，無 raw SQL | — |
| XSS | 無 `dangerouslySetInnerHTML`，React 自動跳脫 | — |
| 速率限制 | 登入（IP 10/5分 + 帳號 5/5分）、註冊（IP 5/小時），在 bcrypt 之前先擋 | `src/lib/rate-limit.ts`, `(auth)/actions.ts` |
| 頭像 | 只接受 `data:image/` data URL | `src/lib/validations.ts` |
| 證件最小化 | `VerificationRequest.docUrl` 在審核（通過/退回）後即清空，不長期保留 | `src/app/admin/actions.ts` |
| 本名保護 | 對外只顯示化名或遮罩本名 | `src/lib/user.ts` |
| 安全標頭 | HSTS、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy | `next.config.ts` |
| Secrets | `.env` 已 gitignore；`AUTH_SECRET` 由環境注入 | — |

---

## 6. 核心流程

- **註冊/登入**：Server Action → Zod → （限流）→ 建立 User（老師同時建空白 TutorProfile）→ 自動登入。
- **發案 → 應徵 → 媒合**：學生 `createJob` → 老師 `applyToJob`（限 TUTOR、案件需 OPEN、不可重複）→ 學生 `acceptApplication`（其餘自動 REJECTED、案件轉 MATCHED）。
- **私訊**：`startConversation`（去重）→ `sendMessage`（驗對話成員）。前端 `ChatPoller` 輪詢更新。
- **評價**：`submitReview` 需「雙方曾完成媒合」且未評過；老師會即時重算平均星等。
- **認證審核**：使用者上傳證件 → ADMIN 在 `/admin/verifications` 通過/退回 → 更新對應旗標並清空證件影像。

---

## 7. 環境變數

| 變數 | 用途 | 範例／產生 |
|---|---|---|
| `DATABASE_URL` | 連線字串（serverless runtime；正式用 Neon **pooled**） | `postgresql://user:pass@host/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | 直連字串，供 `prisma migrate deploy`（正式用 Neon **direct**；本機與 `DATABASE_URL` 相同即可） | `postgresql://user:pass@host/db?sslmode=require` |
| `AUTH_SECRET` | NextAuth JWT 簽章金鑰（**正式環境務必獨立產生**） | `openssl rand -base64 33` |

正式部署設定見 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

---

## 8. 本機開發

```bash
# 需要本機 Postgres（或用 Docker，見根目錄 DOCKER.md）
npm install
# 設定 .env 的 DATABASE_URL / DIRECT_URL / AUTH_SECRET（本機 DIRECT_URL 與 DATABASE_URL 相同即可）
npx prisma migrate deploy   # 套用遷移
npm run db:seed             # （選用）灌示範資料 — 僅限本機
npm run dev                 # http://localhost:3000
```

常用指令：

```bash
npm run dev      # 開發伺服器
npm run build    # prisma generate + migrate deploy + next build
npm run lint     # ESLint
npm run db:seed  # 灌示範資料（勿在正式環境）
npx prisma studio  # 視覺化檢視/編輯資料庫
```

---

## 9. 已知限制 / 技術債

依優先序，留待上線後處理（細節見 `DEPLOYMENT.md` 的 Phase 3）：

1. **證件仍以 base64 存主資料庫**（審核前的 PENDING 期間）。建議改存物件儲存（Vercel Blob / S3）+ 簽名短效 URL。
2. **未審核的 PENDING 證件不會自動過期** → 建議加排程清掉超過 N 天的 `docUrl`。
3. **無 Content-Security-Policy**。需在 `proxy.ts` 串 nonce 後再開，避免打爆 inline script/style。
4. **RateLimit 過期列不自動清理**（launch 量級可忽略）。量大可改 Upstash 滑動視窗。
5. **高併發下的連線數**：已用 Neon pooled（runtime）+ direct（migration）；流量大再調 Neon 連線上限或導入 Prisma Accelerate。
6. 個資法（PDPA）所需的隱私權政策、蒐集同意、保存期限為營運/法務事項，非程式可代勞。
