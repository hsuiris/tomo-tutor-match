# Tomo 家教媒合平台

> A two-sided tutoring marketplace for Taiwan: parents post requests, tutors apply, and both sides compare, chat, and review each other.

家長和學生在 Tomo 發布家教需求，老師建立檔案去應徵，雙方在同一個平台比較條件、私訊約試教，上完課再互相評價。服務對象是在台灣找家教的家庭，以及想接案的家教老師。

[![Demo](https://img.shields.io/badge/demo-tutor--match--mu.vercel.app-7c9a5a?style=flat-square)](https://tutor-match-mu.vercel.app) ![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs) ![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?style=flat-square&logo=prisma) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1?style=flat-square&logo=postgresql&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)

![Tomo 的首頁、老師檔案與私訊畫面](docs/screenshots/hero.png)

線上版本：https://tutor-match-mu.vercel.app

## 功能

以下截圖是用 `prisma/seed.ts` 的示範資料在本機拍的，畫面上的老師、家長與對話都是虛構的。

### 找老師

篩選條件有科目、年級、地區、時薪區間、性別、教育程度和畢業學校，大部分可以複選，地區可以細到行政區（例如「台北市大安區」）。預設的「推薦」排序會先列出通過實名認證、學歷認證的老師，再依評價高低排；也可以改成依時薪、評價或上架時間排序。

![找老師頁：篩選條件與老師卡片](docs/screenshots/tutors.png)

點進老師檔案，可以看到學歷、教學經驗、各科目與年級的客製時薪、考試成績、可以上課的時段，以及其他家長留下的評價。老師的本名不會公開，對外顯示的是化名，例如「王老師」。

### 發布需求、比較應徵老師

家長發布需求時，要填科目、年級、上課地區（可以多選）、預算區間，也可以寫學生目前的狀況和希望加強的方向。老師送出應徵後，家長在需求頁可以做這幾件事：

- 有兩位以上老師應徵時，看「應徵老師比較」表，把評價、時薪、認證、學歷、經驗排在一起比
- 在每一筆應徵底下留言，直接問試教時間或上課方式
- 按「接受並配對」選定老師，其他應徵會自動改成婉拒，並發站內通知給老師

需求頁也會依科目、年級、地區和預算推薦還沒應徵的老師，這一區只有發布需求的人看得到。

![需求頁：應徵老師比較表與應徵討論](docs/screenshots/job-applicants.png)

### 私訊

家長和老師可以一對一私訊。對話頁用 polling（每隔一段時間去伺服器問有沒有新訊息）更新，間隔是 4 秒，瀏覽器分頁切到背景時會暫停。導覽列的紅點會顯示未讀私訊和系統通知的數量。

![私訊對話畫面](docs/screenshots/messages.png)

### 行情統計與時薪估算

「行情統計」頁不用登入就能看，依年級、科目、科目 × 年級列出平台上老師的平均時薪。

登入的老師會多看到一張「AI 行情估算」卡。它的算法是固定規則，沒有呼叫 AI 模型：先拿平台上同科目、同年級的平均時薪當基準，再依教學年資、學歷、完成幾項認證、評價高低做加減成，最後算出建議時薪區間，每一項加減成都會列在右邊。平台上沒有對應科目或年級的資料時，改用 `src/lib/market-baseline.ts` 整理的公開行情當基準。

![行情統計頁與時薪估算卡](docs/screenshots/stats.png)

### 管理後台

管理員登入後，從導覽列的「管理後台」進入 `/admin`。

| 頁面 | 用途 |
|---|---|
| 總覽 | 使用者、需求、應徵的數量，以及近 7 天新增數 |
| 使用者 | 依身分或關鍵字找使用者，可以停用帳號 |
| 媒合 | 查看需求與應徵狀態，必要時強制關閉需求 |
| 內容 | 刪除討論區文章、留言與評價 |
| 行情 | 老師時薪與家長預算的供需對照，包含還沒上架的老師 |
| 認證審核 | 審核實名與學歷證件，審核完就把證件影像從資料庫清掉 |

![管理後台總覽](docs/screenshots/admin.png)

### 其他功能

- 帳號不分家長或老師，同一個帳號可以從導覽列左上角切換身分，要接案時再建立老師檔案
- 註冊後要完成 Email 驗證，才能發需求、應徵、私訊和發文
- 雙向評價：只有真的配對成功過的雙方可以互評，「當老師的評分」和「當學生的評分」分開統計
- 收藏老師或需求，並加上只有自己看得到的備註
- 討論區分老師板和家長板，可以匿名發文，留言可以再回覆一層
- 老師檔案最多上傳 5 張照片，點開可以放大

## 技術架構

```mermaid
flowchart LR
  U[瀏覽器] --> V["Vercel<br/>Next.js 16 App Router"]
  V -- "Prisma（pooled 連線）" --> N[("Neon PostgreSQL")]
  V -- "驗證信、通知信" --> M["Resend<br/>或 Gmail SMTP"]
```

| 層 | 使用的技術 |
|---|---|
| 框架 | Next.js 16 App Router，搭配 React Server Components（先在伺服器把畫面組好再送到瀏覽器的元件）和 Server Actions（表單送出後直接在伺服器執行的函式） |
| 前端 | React 19、Tailwind CSS v4、react-hook-form |
| 資料驗證 | Zod，註冊、需求、應徵、檔案等表單都先過 schema 檢查 |
| 登入 | Auth.js（NextAuth v5）的 Credentials provider（用帳號密碼登入），session 存在 JWT（有簽章的登入憑證）裡 |
| 資料庫 | PostgreSQL，正式環境用 Neon；ORM（把資料表對應成程式物件的工具）用 Prisma 6 |
| 寄信 | 有設 `RESEND_API_KEY` 就用 Resend，沒有的話改用 Gmail SMTP，兩個都沒設就不寄 |
| 部署 | Vercel，流量統計用 `@vercel/analytics`，GA4 可選 |

<details>
<summary>安全設計</summary>

| 項目 | 做法 | 程式位置 |
|---|---|---|
| 密碼 | bcrypt 雜湊（cost 10），資料庫只存雜湊值 | `src/auth.ts` |
| 權限檢查 | 路由層只擋「有沒有登入」，真正的權限在每個 Server Action 裡檢查，例如只有對話雙方能送訊息、只有需求發布者能接受應徵 | `src/proxy.ts`、各 `actions.ts` |
| Email 驗證、重設密碼 | token 用 sha256 雜湊後存資料庫，有期限、只能用一次 | `src/lib/verify-email.ts` |
| rate limit（限制同一來源在一段時間內的請求次數） | 登入、註冊、發文、私訊、評價、應徵留言都有限制，計數存在 PostgreSQL | `src/lib/rate-limit.ts` |
| 證件影像 | 審核通過或退回後立刻清掉 `docUrl` | `src/app/admin/actions.ts` |
| 本名 | 對外只顯示化名，沒有化名時本名只留第一個字，例如「王＊＊」 | `src/lib/user.ts` |
| HTTP 安全標頭 | HSTS、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy | `next.config.ts` |
| 示範資料 | seed 在 `NODE_ENV` 或 `VERCEL_ENV` 是 production 時直接報錯，不會寫進正式資料庫 | `prisma/seed.ts` |

完整說明與已知限制在 [docs/TECHNICAL.md](docs/TECHNICAL.md)。

</details>

<details>
<summary>設計紀錄：已移除的加權配對引擎</summary>

2026 年 7 月以前，「找老師」和「找學生」頁各有一個「智能配對」分頁，用一套規則式的加權引擎替每位候選算 0 到 100 的契合度，並附上推薦理由。commit `aa19b39` 把兩頁統一改成篩選加排序，配對引擎一併刪除。移除前的原始碼可以在 [`b09de3d` 的 src/lib/match.ts](https://github.com/hsuiris/tomo-tutor-match/blob/b09de3d5604f8505d8ac51d30aebeaf784b5179f/src/lib/match.ts) 看到。

計分方式是每個維度給 0 到 1 的分數，乘上權重後，只拿有填的維度做加權平均，再換算成 0 到 100。

家長找老師時的維度與基準權重：

| 維度 | 權重 | 計分規則 |
|---|---|---|
| 科目 | 30 | 硬門檻，不教這個科目的老師最後分數乘 0.1 |
| 地區、授課方式 | 16 | 當地可以教給 1 分，只能線上替代給 0.5 分 |
| 評價 | 16 | 評論數少的分數比較保守，新老師給中間值 |
| 預算 | 14 | 比較老師時薪區間和家長預算區間重疊多少 |
| 學制 | 12 | 能不能教這個年級 |
| 安全認證 | 8 | 通過幾項認證 |
| 性別偏好 | 4 | 家長有指定才計入 |

老師找需求時的維度是科目（硬門檻）32、地區 18、預算 18、學制 12、競爭程度 12（應徵人數越少分數越高）、新鮮度 8。家長也可以選「最在意預算、評價或學歷認證」，引擎會放大對應維度的權重。

</details>

## 本機跑起來

需要 Node.js 20 以上和一個 PostgreSQL 資料庫。手邊沒有資料庫的話，可以用 Docker 開一個：

```bash
docker run -d --name tomo-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tomo postgres:17
```

接著安裝套件、建立 `.env`、建資料表、灌示範資料：

```bash
git clone https://github.com/hsuiris/tomo-tutor-match.git
cd tomo-tutor-match
npm install

cat > .env <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tomo
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/tomo
AUTH_SECRET=$(openssl rand -base64 33)
EOF

npx prisma migrate deploy
npm run db:seed
npm run dev
```

打開 http://localhost:3000 就可以用了。

### 示範帳號

`npm run db:seed` 之後才有這些帳號，密碼都是 `test1234`，只存在你本機的資料庫。

| 身分 | 帳號 |
|---|---|
| 管理員 | `admin@demo.com` |
| 家長、學生 | `parent1@demo.com`、`parent2@demo.com`、`student@demo.com` |
| 老師 | `wang@demo.com`、`chen@demo.com`、`lin@demo.com`、`chang@demo.com`、`huang@demo.com`、`lee@demo.com`、`wu@demo.com`、`cheng@demo.com` |

seed 只會建立帳號、老師檔案、評價和討論區文章。想看需求比較表或私訊畫面，要自己登入家長帳號發需求，再換老師帳號應徵。

### 環境變數

| 變數 | 必填 | 用途 |
|---|---|---|
| `DATABASE_URL` | 是 | 程式執行時用的連線字串，Neon 請用 pooled 連線 |
| `DIRECT_URL` | 是 | `prisma migrate` 用的直連字串；本機填跟 `DATABASE_URL` 一樣就好 |
| `AUTH_SECRET` | 是 | Auth.js 簽 JWT 的金鑰，用 `openssl rand -base64 33` 產生 |
| `RESEND_API_KEY`、`EMAIL_FROM` | 否 | 用 Resend 寄驗證信和通知信 |
| `GMAIL_USER`、`GMAIL_APP_PASSWORD` | 否 | 沒有 Resend 時改用 Gmail SMTP |
| `NEXT_PUBLIC_SITE_URL` | 否 | 自訂網域，sitemap、OG 圖和信件連結會用它 |
| `NEXT_PUBLIC_GA_ID`、`NEXT_PUBLIC_GSC_VERIFICATION` | 否 | GA4 和 Google Search Console 驗證 |

沒有設定任何寄信服務時，Email 驗證會自動停用，本機開發不會被卡住。

### 常用指令

```bash
npm run dev          # 開發伺服器
npm run build        # prisma generate + next build
npm run lint         # ESLint
npx prisma studio    # 用瀏覽器看資料庫內容

# src/lib 底下的 *.test.ts 是 node:assert 自檢腳本，用 tsx 直接跑
for f in src/lib/*.test.ts; do npx tsx "$f" && echo "ok $f"; done
```

## 部署

正式環境是 Vercel 加 Neon。build 指令只跑 `prisma generate && next build`，不會連資料庫；資料庫遷移要另外手動跑 `npx prisma migrate deploy`，seed 不會在正式環境執行。環境變數設定、Resend 網域驗證、Neon 最小權限帳號的步驟寫在 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)，監控方式在 [docs/MONITORING.md](docs/MONITORING.md)。

## 專案結構

```
src/
  app/
    (auth)/        註冊、登入、忘記密碼、重設密碼
    tutors/        找老師列表、老師檔案
    jobs/          需求列表、發布、編輯、需求頁（比較表與應徵討論）
    messages/      私訊與系統通知
    stats/         行情統計與時薪估算
    forum/         討論區（老師板、家長板）
    favorites/     收藏
    dashboard/     個人面板、老師檔案、帳號與認證、我的需求與應徵
    admin/         管理後台
    u/[id]/        公開個人頁與評價
  lib/
    estimate.ts        時薪估算規則
    market.ts          行情彙總
    market-baseline.ts 平台資料不足時的公開行情基準
    regions.ts         全台縣市與行政區資料、地區比對
    rate-limit.ts      rate limit
    verify-email.ts    Email 驗證
  components/      UI 元件
  proxy.ts         Next.js 16 的 middleware（未登入導向登入頁）
prisma/
  schema.prisma    資料模型
  migrations/      遷移檔
  seed.ts          示範資料（只給本機用）
docs/
  TECHNICAL.md     技術文件
  DEPLOYMENT.md    上線步驟
  MONITORING.md    監控
  screenshots/     README 截圖
```
