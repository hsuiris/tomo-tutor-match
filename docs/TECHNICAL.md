Tomo 技術文件

家教媒合平台。統一帳號（同一人可同時當家長與老師），家長發布需求、老師應徵並就每筆應徵討論；雙方可私訊、互評、保留成交紀錄，平台提供安全認證審核、智能配對與應徵者比較、討論區。註冊需完成 Email 驗證才能使用互動功能。

---

## 1. 技術棧

| 層     | 技術                                                              |
| ------ | ----------------------------------------------------------------- |
| 框架   | Next.js 16（App Router、React Server Components、Server Actions） |
| 前端   | React 19、Tailwind CSS v4、react-hook-form + @hookform/resolvers  |
| 認證   | NextAuth v5（Auth.js）Credentials provider、JWT session           |
| 資料庫 | PostgreSQL + Prisma 6（client 輸出在`src/generated/prisma`）    |
| 驗證   | Zod（`src/lib/validations.ts`）                                 |
| 密碼   | bcryptjs（cost 10）                                               |

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
    site.ts          站台正式網址（sitemap/OG/信件連結的單一來源）
    verify-email.ts  Email 驗證 token 產生/驗證/寄信/查詢
    email.ts         寄信（Resend 優先、Gmail SMTP fallback）+ 通知偏好
    notification.ts  站內系統通知
    profile-detail.ts 老師檔案詳細欄位（成績/客製時薪/上課時間）型別與 helper
    match.ts / estimate.ts / forum.ts / regions.ts / constants.ts
  app/
    (auth)/          註冊、登入、忘記/重設密碼（actions.ts）
    verify-email/    Email 驗證引導與完成頁
    dashboard/       面板；老師檔案、帳號與安全、我發布的需求、我的應徵、過去的老師、我的學生
    jobs/            案件列表、發布、詳情、編輯、媒合
    tutors/          老師列表、詳情
    messages/        一對一聊天（未讀/紅點）
    forum/           討論區（老師板 / 家長板；巢狀回覆、編輯刪除）
    favorites/       收藏（已應徵/未應徵、備註）
    admin/           認證審核與內容管理（限 ADMIN）
    u/[id]/          公開個人檔案 + 評價 + 照片牆
    privacy/ terms/  隱私權政策、服務條款
    robots.ts sitemap.ts opengraph-image.tsx  SEO
    error.tsx not-found.tsx  錯誤與 404 頁
    api/auth/[...nextauth]/  NextAuth route handler
  components/        UI 元件（表單、卡片、Avatar、CookieNotice…）
prisma/
  schema.prisma      資料模型
  migrations/        遷移檔
  seed.ts            示範資料（僅限本機/測試，勿在正式環境執行）
```

---

## 3. 資料模型（Prisma）

核心實體與關係（完整定義見 `prisma/schema.prisma`）：

- **User** — 帳號。`role`（STUDENT/TUTOR/ADMIN）、`name`（本名，不公開）、`displayName`（公開化名）、`passwordHash`、認證旗標（`idVerified`/`bgCheckVerified`/`eduVerified`）、`emailVerified`（Email 驗證時間；null=未驗證，見第 4 節）、`photoUrls[]`（檔案照片牆）、通知偏好。
- **TutorProfile** — 老師檔案（1:1 User）。科目/學制/地區/預設時薪/履歷/`isPublished`/評分統計，另有 `exams`（考試成績）、`rateRules`（各科目/年級客製時薪）、`availability`（可配合上課時間），皆為 Json。
- **JobPost** — 學生需求案件。`regions[]`（上課地區，可多選）、`status`（OPEN/MATCHED/CLOSED）；案主可編輯/刪除（限自己、OPEN）。
- **Application** — 老師對案件的應徵。`status`（PENDING/ACCEPTED/REJECTED）；`@@unique([jobId, tutorId])` 防重複應徵；應徵時自動加入收藏。
- **ApplicationReply** — 應徵下的討論串（案主與該應徵老師互相回覆）。
- **Conversation / Message** — 一對一聊天；`userAId < userBId` 保證配對唯一；`Message.readAt` 記已讀（未讀紅點/徽章）。
- **Review** — 雙向評價；每人對同一對象、同一身分限評一次。
- **Favorite** — 收藏老師卡或案件卡；`note`（私人備註）。收藏頁分「已應徵/未應徵」。
- **Notification** — 站內系統通知（審核結果、新應徵、被錄取、落選、討論回覆…）；可逐則刪除。
- **VerificationRequest** — 證件審核申請。`docUrl` 為證件影像（**審核後即清空**，見第 5 節）。
- **ForumPost / ForumReply** — 討論區，支援匿名；作者可編輯/刪除、回覆可巢狀（`parentId`，一層）、`editedAt` 標「已編輯」。
- **EmailVerificationToken / PasswordResetToken** — Email 驗證與重設密碼權杖（sha256 儲存、限時、單次）。
- **RateLimit** — 速率限制計數（key / count / expiresAt）。

列舉：`Role`、`JobStatus`、`ApplicationStatus`、`TeachingMode`、`Gender`、`VerificationType`、`VerificationStatus`、`ForumBoard`。

---

## 4. 認證與授權

**認證**：Credentials provider（`src/auth.ts`），Zod 驗證 → 查 User → `bcrypt.compare`。Session 用 JWT，token 帶 `id` 與 `role`。

**授權採雙層**：

1. **路由層（`src/proxy.ts` + `auth.config.ts` 的 `authorized`）**：`/dashboard`、`/jobs/new`、`/admin`、`/messages` 需登入。這只擋「有沒有登入」，**不分角色**。
2. **動作層（每個 Server Action / 頁面）**：真正的權限在這裡——
   - 取 `session = await auth()`，未登入直接擋。
   - 資源操作驗證擁有權（IDOR 防護），例如：只有對話雙方能送訊息、只有案件學生能接受應徵、只有被媒合過的雙方能互評、只有作者能編輯/刪除自己的貼文/回覆/需求。
   - 管理功能驗 `role === "ADMIN"`（`src/app/admin/actions.ts` 的 `requireAdmin()`、`admin/verifications` 頁面）。
3. **Email 驗證閘門**：未驗證者（`emailVerified` 為 null）在 `/dashboard`、`/jobs/new` 導向 `/verify-email`；發案、應徵、私訊、發文等互動 action 也各自擋下（`isEmailVerified`，見 `src/lib/verify-email.ts`）。「閱讀」訊息不擋，避免收到訊息卻進不去。既有帳號 migration 一律 backfill 為已驗證。

> 設計原則：**不依賴路由層做授權**。Next.js 官方安全建議也是「在每個 action 內驗證」。註冊不分老師/學生端（統一帳號，要教學再「成為老師」建檔），role 只允許 STUDENT/TUTOR，無法自行註冊成 ADMIN。

---

## 5. 安全設計（已實作）

| 項目          | 作法                                                                               | 位置                                             |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| 密碼          | bcrypt cost 10，DB 只存 hash；政策為至少 8 字元含英數                              | `src/auth.ts`, `(auth)/actions.ts`, `validations.ts` |
| Email 驗證    | 註冊需驗證 Email 才能互動；權杖 sha256 儲存、24h 限時、單次                        | `src/lib/verify-email.ts`                      |
| 輸入驗證      | Zod schema 全面驗證                                                                | `src/lib/validations.ts`                       |
| SQL injection | 全程 Prisma 參數化查詢，無 raw SQL                                                 | —                                               |
| XSS           | 無`dangerouslySetInnerHTML`，React 自動跳脫                                      | —                                               |
| 速率限制      | 登入/註冊/重設密碼、發文/回覆/私訊/開對話/評價/應徵討論皆限流                       | `src/lib/rate-limit.ts`                        |
| 重設/驗證連結 | 用固定站台網址組連結，不吃請求 Host（防 host header poisoning）                    | `src/lib/site.ts`, `(auth)/actions.ts`       |
| 頭像/照片     | 只接受`data:image/` data URL；照片牆上限 3 張                                    | `src/lib/validations.ts`, `account/actions.ts` |
| 證件最小化    | `VerificationRequest.docUrl` 在審核（通過/退回）後即清空，不長期保留             | `src/app/admin/actions.ts`                     |
| seed 守衛     | seed 含示範帳號，對 production 執行會直接 throw                                    | `prisma/seed.ts`                               |
| 本名保護      | 對外只顯示化名或遮罩本名                                                           | `src/lib/user.ts`                              |
| 安全標頭      | HSTS、X-Content-Type-Options、X-Frame-Options、Referrer-Policy、Permissions-Policy | `next.config.ts`                               |
| Secrets       | `.env` 已 gitignore；`AUTH_SECRET` 由環境注入                                  | —                                               |

---

## 6. 核心流程

- **註冊/登入**：Server Action → Zod →（限流）→ 建立 User → 寄 Email 驗證信 → 導向 `/verify-email`。點信中連結 `verifyEmailToken` 完成驗證後導回面板。「成為老師」再建空白 TutorProfile 並升級 role。
- **發案 → 應徵 → 媒合**：家長 `createJob`（多地區）→ 老師 `applyToJob`（需有檔案、案件 OPEN、不可重複、不可應徵自己的案；成功後自動加入收藏「已應徵」並站內通知案主）→ 就每筆應徵可在案件頁討論（`replyToApplication`）→ 家長 `acceptApplication`（其餘自動 REJECTED 並通知、案件轉 MATCHED）。老師可 `updateApplication`/`cancelApplication`（限 PENDING）；家長可 `updateJob`/`deleteOwnJob`。兩位以上應徵時案件頁顯示「應徵者比較表」。
- **接案狀態**：老師在面板一鍵切換 `isPublished`（公開接案/關閉），關閉後不出現在找老師列表。
- **私訊**：`startConversation`（去重）→ `sendMessage`（驗對話成員、限流）。開啟對話標 `readAt` 已讀；導覽列顯示未讀紅點（未讀私訊＋未讀通知）。前端 `ChatPoller` 背景分頁暫停輪詢。
- **評價 / 成交紀錄**：`submitReview` 需「雙方曾完成媒合」且未評過（分老師/學生身分）；家長「過去的老師」、老師「我的學生」可回頭評價。
- **討論區**：發文/回覆可編輯刪除、回覆可巢狀一層，新回覆站內通知貼文與被回覆者。
- **認證審核**：使用者上傳證件 → ADMIN 在 `/admin/verifications` 通過/退回 → 更新對應旗標、清空證件影像、站內信＋Email 通知本人。

---

## 7. 環境變數

| 變數             | 用途                                                                                                    | 範例／產生                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | 連線字串（serverless runtime；正式用 Neon**pooled**）                                             | `postgresql://user:pass@host/db?sslmode=require&pgbouncer=true` |
| `DIRECT_URL`   | 直連字串，供`prisma migrate deploy`（正式用 Neon **direct**；本機與 `DATABASE_URL` 相同即可） | `postgresql://user:pass@host/db?sslmode=require`                |
| `AUTH_SECRET`  | NextAuth JWT 簽章金鑰（**正式環境務必獨立產生**）                                                 | `openssl rand -base64 33`                                       |

寄信（Resend 優先、Gmail fallback）、站台網址、GA4/GSC 等選用變數與完整設定步驟見 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。未設任何寄信服務時，Email 驗證會自動停用（避免鎖死環境）。

---

## 8. 本機開發

```bash
# 需要本機 Postgres
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

1. **圖片（頭像/證件/檔案照片）以 base64 存主資料庫**。頭像/照片是列表頁 payload 的最大單一來源；證件僅 PENDING 期間存在（審核後即刪）。建議改存物件儲存（Vercel Blob / S3）+ 簽名短效 URL；`avatarUrl` 欄位已相容外部網址。
2. **未審核的 PENDING 證件不會自動過期** → 建議加排程清掉超過 N 天的 `docUrl`。
3. **Email 送達率**：未接自有網域前用 Gmail SMTP，系統信易進垃圾匣；正式應接 Resend + 網域並設 SPF/DKIM/DMARC（見 `DEPLOYMENT.md`）。
4. **無 Content-Security-Policy**。需在 `proxy.ts` 串 nonce 後再開，避免打爆 inline script/style。
5. **無 2FA**：至少 ADMIN 應有第二因素；現以強密碼＋登入限流頂著。
6. **RateLimit 過期列不自動清理**（launch 量級可忽略）。量大可改 Upstash 滑動視窗。
7. **快取**：公開頁多為每請求打 DB；首頁精選、行情統計等可加 `revalidate`。
8. **高併發下的連線數**：已用 Neon pooled（runtime）+ direct（migration）；流量大再調 Neon 連線上限或導入 Prisma Accelerate。
9. **測試覆蓋**：僅純函式自檢（`src/lib/*.test.ts`），server actions／auth 無自動化測試。
10. 個資法（PDPA）的隱私權政策、服務條款為法務事項，`/privacy`、`/terms` 為初稿，上線前應經律師覆核。
