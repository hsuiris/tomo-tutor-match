# Tomo 上線文件（Vercel）

部署目標：**Vercel**（Next.js 應用）+ **Neon**（serverless PostgreSQL）。

> 流程：推上 GitHub → Vercel preview 驗證 → 確認後合併 `main` 設為 production。

---

## 0. 部署架構

```
GitHub repo ──push──▶ Vercel（build + 託管 Next.js）
                         ▼
                   Neon（serverless PostgreSQL，pooled + direct）
                         ▲
   遷移由人「手動」執行：npx prisma migrate deploy（不在 build 內）
```

build 指令（`package.json`）：`prisma generate && next build`
→ build **不連 DB**（避免 build 環境連不到 Neon 導致 P1001）。
遷移改成**手動步驟**（見第 3 節），seed 永不執行。

---

## 1. 前置準備

1. **建立 Git remote 並推送**：
   ```bash
   git remote add origin <你的 GitHub repo 網址>
   git push -u origin launch-prep
   ```
2. **開一個 Neon 專案**，從 dashboard 取兩種連線字串（schema 已設好 `directUrl`，兩個都要用）：
   - **Pooled**（host 含 `-pooler`）→ 給 `DATABASE_URL`，serverless runtime 用；建議帶 `?sslmode=require&pgbouncer=true`。
   - **Direct**（host 不含 `-pooler`）→ 給 `DIRECT_URL`，build 階段的 `prisma migrate deploy` 用。
   - Neon 沒有 Supabase 那種 IPv6 直連雷，Vercel 直接連得上。

---

## 2. 環境變數（在 Vercel Dashboard 設定）

Project → Settings → Environment Variables，**Production 與 Preview 都要設**（build 也要讀得到）：

| 變數                   | 值                                                                               |
| ---------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon**pooled** 連線字串（建議 `?sslmode=require&pgbouncer=true`）        |
| `DIRECT_URL`         | Neon**direct（非 pooler）** 連線字串，供 `prisma migrate deploy` 用      |
| `AUTH_SECRET`        | `openssl rand -base64 33` 產生的**全新**金鑰                             |
| `RESEND_API_KEY`     | （建議）Resend API 金鑰；設了就優先用 Resend 寄信（送達率高、不進垃圾匣） |
| `EMAIL_FROM`         | （Resend 用）寄件人，如`Tomo 家教媒合 <noreply@你的網域>`；網域需在 Resend 驗證通過 |
| `GMAIL_USER`         | （過渡／備援）Email 通知寄件帳號，如`tomoocustomer@gmail.com`                  |
| `GMAIL_APP_PASSWORD` | （過渡／備援）Gmail**應用程式密碼**（16 碼，非帳號密碼）；需與 GMAIL_USER 一起設 |
| `NEXT_PUBLIC_SITE_URL` | （選用）自訂網域完整網址（如 `https://tomo.tw`）；sitemap／OG／重設密碼信的絕對網址用它，未設時退回 Vercel 正式網域 |
| `NEXT_PUBLIC_GA_ID` | （選用）GA4 評估 ID（`G-XXXXXXX`）；未設不載入 GA |
| `NEXT_PUBLIC_GSC_VERIFICATION` | （選用）Google Search Console 的 meta 驗證碼；未設不輸出 |

> 📧 **Email 通知**：使用者可在「帳號與安全 → 通知設定」開啟；驗證信與重設密碼信一律會寄。
> 寄信優先序（見 `src/lib/email.ts`）：`RESEND_API_KEY` → Gmail SMTP → 都沒設則略過不報錯。
>
> **建議：用 Resend + 自有網域（解決驗證信被歸垃圾郵件）**
> 1. 準備一個網域（Cloudflare / Namecheap 註冊，`.com` 一年約 300–500 元）。
> 2. 註冊 [resend.com](https://resend.com) → Domains → Add Domain 輸入你的網域。
> 3. Resend 會給你數筆 **DNS 記錄**，到網域商後台一一新增：
>    - **SPF**：一筆 `TXT`，`v=spf1 include:...`（授權 Resend 代寄）
>    - **DKIM**：一至數筆 `TXT`／`CNAME`（Resend 提供的簽章金鑰）
>    - **DMARC**：一筆 `TXT`，名稱 `_dmarc`，值如 `v=DMARC1; p=none; rua=mailto:你@網域`
>    - （Resend 頁面會逐筆列出「名稱／類型／值」，照抄即可）
> 4. 等 Resend 顯示網域 **Verified**（DNS 生效約數分鐘～數小時）。
> 5. Resend → API Keys 建一把金鑰 → Vercel 設 `RESEND_API_KEY`；
>    `EMAIL_FROM` 設為 `Tomo 家教媒合 <noreply@你的網域>`（網域須與驗證的一致）。
> 6. Redeploy。之後寄信自動走 Resend，SPF/DKIM/DMARC 通過，大幅降低進垃圾匣的機率。
>
> **過渡（還沒有網域）**：先設 `GMAIL_USER` + `GMAIL_APP_PASSWORD` 用 Gmail SMTP。
> 取得應用程式密碼：Google 帳號 → **安全性** → 開啟兩步驟驗證 → **應用程式密碼** → 產生 16 碼。
> Gmail 個人帳號寄系統信較易進垃圾匣，`/verify-email` 頁已提示使用者到垃圾郵件匣尋找。

⚠️ **重要**：

- 本機 `.env` 裡的 dev `AUTH_SECRET` 與 dev DB 密碼一律視為**已洩漏**，正式環境務必用全新的強密碼（Neon role 密碼用 dashboard 一鍵重設即可，詳見〈安全〉節）。
- Vercel **不會**讀你的 `.env`（已 gitignore），一定要在 dashboard 設。
- NextAuth v5 在 production 沒設 `AUTH_SECRET` 會直接啟動失敗；Vercel 會自動信任 host，**不需**額外設 `AUTH_TRUST_HOST`。

---

## 🔒 安全：DB 密碼 / 最小權限 / 對外暴露

> 重點：正式 DB 是 Neon（managed serverless），它的 host 本來就在公網上，沒有「關防火牆」這回事。真正有效的防護是下面這幾項。

**A. 一定要做（免費）**

- **強密碼**：Neon Console → 專案 → Roles → 該 role → **Reset password**，Neon 會生高強度隨機密碼並更新 pooled / direct 兩條連線字串；貼回 Vercel env 後 redeploy。本機 dev 密碼絕不重用於 Neon。
- **強制 TLS**：連線字串帶 `?sslmode=require`（pooled 再加 `&pgbouncer=true`）。更嚴可用 `verify-full` + Neon CA。
- **連線字串只放 Vercel env**：`.env` 已 gitignore 且未被 git 追蹤，✅ 不要把任何連線字串寫進 repo。

**B. 最小權限 role（runtime 與 migration 分權）**

剛好對上本專案的 pooled / direct 雙連線設計：runtime 只需 CRUD，migration 才需要 DDL。

- `DATABASE_URL`（pooled，runtime）→ 用低權限 `app_user`（只能增刪改查）
- `DIRECT_URL`（direct，migration）→ 用 owner role（`prisma migrate deploy` 要建表）

在 Neon SQL Editor **以 owner 身分**執行一次：

```sql
-- 1. 建立只給 app runtime 用的低權限 role
CREATE ROLE app_user WITH LOGIN PASSWORD '<用 Neon 生成的強密碼>';

-- 2. 只能連這個 DB、用 public schema
GRANT CONNECT ON DATABASE <dbname> TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- 3. 現有資料表給 CRUD（不含 DDL）
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 4. 未來由 owner 新建的表 / sequence 也自動授權（所以這段要用 owner 跑）
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

之後把 `DATABASE_URL` 改成用 `app_user` 連線；`DIRECT_URL` 維持 owner（migration 用）。

**C. 「只允許 Vercel」的現實**

- Neon 有 **IP Allow**（Scale / Business 付費方案），但 Vercel serverless **沒有固定 egress IP**（Hobby/Pro 都是動態的），所以無法把 Vercel 加進白名單——這條現階段**做不了也不必做**。
- 完全私網要 Neon **Private Networking（AWS PrivateLink）**，Business/Enterprise 才有，YAGNI。
- 結論：對 Vercel + Neon，正確姿勢就是 **A + B + Neon「Protected branches」鎖住正式分支**，不要為了 IP 白名單去升級方案。

---

## 3. 部署步驟

1. Vercel → **Import** 該 GitHub repo（框架自動辨識為 Next.js）。
2. 設定第 2 節的環境變數。
3. **先手動套用遷移**（從本機跑，本機連得到 Neon）：

   ```bash
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
   ```

   這會在 Neon 建好所有資料表。之後每次新增 migration 都要再跑一次（建議在 deploy 前先跑）。
4. 觸發 deploy。build 只跑 `prisma generate && next build`，**不連 DB**。
5. 先用 **preview deployment**（推 `launch-prep` branch 產生的網址）驗證，跑第 6 節 smoke test。
6. 確認無誤 → 合併 `launch-prep` 進 `main`，將 `main` 設為 production branch。

---

## 4. 首次上線：建立管理員帳號 ⚠️

因為已移除自動 seed，**正式 DB 不會有任何 admin**（這正是要的——沒有 `test1234` 後門）。流程：

1. 在線上正常註冊一個你自己的帳號。
2. 用 DB 工具把該帳號 role 改成 ADMIN：

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = '你的email';
   ```

   （或 `npx prisma studio` 連正式 DB 手動改。）

---

## 5. 上線前 Checklist

### 🔴 Phase 0 — 阻斷項（已完成）

- [X] 確認正式 DB **沒有**任何 `@demo.com` 帳號：
  ```sql
  SELECT email, role FROM "User" WHERE email LIKE '%@demo.com';  -- 應為 0 筆
  ```

### 🟠 Phase 1 — 建議修（已完成）

- [X] 登入/註冊/重設密碼、發文/回覆/私訊/開對話/評價/應徵討論皆有速率限制
- [X] 密碼政策至少 8 字元含英數
- [X] 註冊需完成 Email 驗證才能使用互動功能（既有帳號 backfill 為已驗證）
- [X] 重設/驗證連結用固定站台網址（防 host header poisoning）
- [X] seed 含示範帳號，對 production 執行會直接 throw
- [X] `avatarUrl`／檔案照片只接受 `data:image/`
- [X] 證件影像審核後即清除（PII 最小化）

### 🟡 Phase 2 — 環境與部署

- [X] 安全標頭（HSTS / nosniff / X-Frame-Options / Referrer-Policy / Permissions-Policy）— `next.config.ts`
- [X] `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` 由 Vercel 環境注入（非寫死）
- [X] DB 使用強密碼（Neon role 已輪換）、TLS 強制、連線字串只在 Vercel env（對外暴露的現實見〈安全〉節：Vercel 無固定 egress IP，IP 白名單不適用）
- [X] 建立最小權限 `app_user`，`DATABASE_URL` 改用它連線（SQL 見〈安全〉節 B）；`DIRECT_URL` 維持 owner（migration 要 DDL），日後新增 migration 仍由 owner 跑
- [X] 全站 HTTPS（Vercel 預設提供，確認自訂網域憑證 OK）
- [X] `npm run build`、`npm run lint` 在 CI／本機通過
- [X] preview deployment smoke test 通過（第 6 節）

### 🟢 Phase 3 — 上線後

- [ ] 開啟 DB **自動備份**（在 DB 供應商設定，確認可還原）
- [X] 設定監控與告警：程式碼訊號已埋（`<Analytics />`、`[login-failure]` log）；儀表板告警設定見 [MONITORING.md](./MONITORING.md)
- [X] 補上**隱私權政策 / 個資蒐集同意 / 證件保存期限**：`/privacy` 頁（繁中初稿，**待法務覆核**）、註冊頁同意勾選、證件審核後立即刪除已落實；聯絡窗口 `tomoocustomer@gmail.com`
- [ ] **接 Resend + 自有網域**（設 SPF/DKIM/DMARC）解決驗證信進垃圾匣，見第 2 節「Email 通知」
- [X] 服務條款 `/terms`（初稿，**待法務覆核**）、Cookie 告知、SEO（robots/sitemap/OG/metadata）
- [ ] 規劃 CSP（在 `proxy.ts` 串 nonce 後啟用）
- [ ] 至少 ADMIN 帳號導入 2FA
- [ ] 圖片（頭像/照片）改物件儲存（Vercel Blob / S3），降低 DB payload
- [ ] 排程清理：過期的 `RateLimit` 列、超過 N 天未審核的 PENDING 證件 `docUrl`

---

## 6. 部署後 Smoke Test

在 preview / 正式網址逐項確認：

1. 開首頁、老師列表（`/tutors`）能載入。
2. 註冊一個學生帳號 → 自動登入。
3. 連按多次錯誤登入，第 N 次出現「嘗試次數過多」（速率限制生效）。
4. 老師帳號編輯檔案、上傳頭像（非圖片應被擋）。
5. 學生發案 → 老師應徵 → 學生接受 → 雙方可私訊、互評。
6. 用瀏覽器 DevTools 確認回應帶安全標頭（`Strict-Transport-Security` 等）。
7. 管理員登入 `/admin/verifications`，通過一筆認證後，確認證件影像已清除（顯示「影像已清除」）。

---

## 7. 回滾（Rollback）

- **應用程式**：Vercel → Deployments → 選上一個正常版本 → **Promote to Production**（即時生效）。
- **資料庫遷移**：Prisma 遷移**不會自動回滾**。若某次遷移有破壞性變更，需事先備份，必要時用備份還原或撰寫反向遷移。上線前的破壞性 schema 變更務必先在 preview/staging DB 演練。

---

## 8. 例行維運

```bash
# 連正式 DB 檢視資料（小心操作）
DATABASE_URL="<prod url>" npx prisma studio

# 查遷移狀態 / 套用新遷移（需帶 DIRECT_URL）
DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npx prisma migrate status
DATABASE_URL="<pooled url>" DIRECT_URL="<direct url>" npx prisma migrate deploy
```

- **遷移不在 build 內**：新增 migration 後，要手動跑上面的 `migrate deploy`（建議在 deploy 前先跑），Vercel deploy 本身不會碰 DB。
- 永遠不要對正式 DB 執行 `npm run db:seed` 或 `prisma migrate reset`。
