# 監控與告警（Vercel + Neon）

對應 [DEPLOYMENT.md](./DEPLOYMENT.md) Phase 3「設定監控與告警」。
分兩部分：**程式碼已埋的訊號**（本 repo 內）＋**儀表板要手動設的告警**（無法用程式碼代設）。

---

## A. 程式碼已埋好的訊號

| 訊號                     | 位置                                        | 說明                                                      |
| ------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| Web Analytics            | `src/app/layout.tsx`（`<Analytics />`） | `@vercel/analytics`，需在 Vercel 專案開啟 Web Analytics |
| 登入失敗（密碼錯誤）     | `src/app/(auth)/actions.ts`               | stderr：`[login-failure] reason=bad-credentials ip=…`  |
| 登入失敗（速率限制觸發） | 同上                                        | stderr：`[login-failure] reason=rate-limited ip=…`     |

> 登入失敗率＝在 Vercel logs 以字串 `[login-failure]` 過濾的次數。

---

## B. 儀表板手動設定（一次性）

### 1. Vercel Logs / Analytics

- **Web Analytics**：Vercel 專案 → **Analytics** 分頁 → Enable。`<Analytics />` 已在 layout，部署後即開始收 pageview。
- **Runtime Logs**：Vercel 專案 → **Logs**（即時）。Hobby 方案只有即時、不長期保存。
- **告警 / 長期保存**：需 **Log Drains**（Pro 方案）把 log 導到 Datadog／Logtail／Better Stack 等，再於該服務對 `[login-failure]` 設門檻告警（如 5 分鐘內 > 20 次寄信）。
  - 免費替代：每天人工掃一次 Logs 過濾 `[login-failure]`。

### 2. DB 連線數（Neon）

- Neon Console → 專案 → **Monitoring**，看 **Connections** 圖。
- 本專案用 **pooled 連線（pgbouncer）**，serverless 下連線數不該逼近上限；若持續貼上限，多半是某處沒走 pooler 或連線沒釋放。
- **告警**：Neon 付費方案才有原生 metric alert。免費做法：上線初期每隔幾天看一次 Monitoring；連線數異常爬升再查 `src/lib/db.ts` 的 client 是否被重複建立。

### 3. 登入失敗率

- 見 A 節的 stderr 訊號 + B-1 的 Log Drain 告警。
- 另有 `RateLimit` 資料表記錄各 key 的嘗試次數，可直接查近期暴力嘗試：
  ```sql
  SELECT key, count, "expiresAt" FROM "RateLimit"
  WHERE key LIKE 'login:%' ORDER BY count DESC LIMIT 20;
  ```

---

## C. 還沒做、要不要做

- **Error tracking（Sentry 等）**：目前只有 `console.error`/`warn` 進 Vercel logs（`src/app/error.tsx` 已預留掛載點）。流量上來、要追前後端例外堆疊時再接 Sentry。— ponytail: YAGNI 到有量再加。
- **Uptime 監控**：免費可用 Better Stack / UptimeRobot 戳首頁，掉線寄信。

---

## D. 上線驗收審查（2026-07-05）

對照「網站上線驗收六大類別」＋ /cso 全站安全審查的結果。
程式碼安全底子乾淨：server actions 全數有 auth + 擁有權檢查、無 IDOR、無 SQL injection（Prisma 參數化）、
無 XSS sink、重設密碼 token 雜湊＋單次＋限時、git history 無洩漏機密。
完整安全報告：`.gstack/security-reports/2026-07-05-launch-audit.json`（本機，不進版控）。

### D-1. 本次已修（feat/launch-readiness）

| 類別    | 項目                                            | 修法                                                                                                                                        |
| ------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ④ 安全 | seed 含`admin@demo.com`/`test1234` 後門帳號 | `prisma/seed.ts` 加 production 守衛，正式環境直接 throw                                                                                   |
| ④ 安全 | 密碼政策過弱（6 字元）                          | 全面提高為 8+ 字元含英數（validations、changePassword、resetPassword、UI 提示）                                                             |
| ④ 安全 | 重設密碼連結用請求 Host 組 URL                  | 改用`src/lib/site.ts` 的固定站台網址（防 host header poisoning）                                                                          |
| ④ 安全 | 論壇／私訊／評價無節流                          | 發文 5/時、回覆 20/時、新對話 10/時、訊息 30/5 分、評價 10/日（沿用`lib/rate-limit.ts`）                                                  |
| ⑤ SEO  | 無 robots.txt / sitemap.xml                     | 新增`src/app/robots.ts`（擋 /admin /dashboard /messages /favorites /api）＋ `src/app/sitemap.ts`（靜態頁＋老師／案件／論壇文各 500 筆） |
| ⑤ SEO  | 無 metadataBase / title template / canonical    | root layout 補齊；公開列表與動態頁（/u/[id]、/jobs/[id]、論壇）補`generateMetadata` ＋ canonical                                          |
| ⑤ SEO  | 無 GA4 / GSC 驗證                               | env 開關：`NEXT_PUBLIC_GA_ID`、`NEXT_PUBLIC_GSC_VERIFICATION`（未設不輸出）                                                             |
| ② 內容 | 無社群分享預覽                                  | `src/app/opengraph-image.tsx` 動態產生品牌 OG 圖＋layout 的 openGraph/twitter 設定                                                        |
| ② 內容 | 頁尾無聯絡方式                                  | 頁尾加`tomoocustomer@gmail.com`（已確認為正確信箱）＋服務條款連結                                                                         |
| ⑥ 法務 | 無服務條款頁                                    | 新增`/terms`（法務初稿，上線前請律師覆核，同 privacy）                                                                                    |
| ⑥ 法務 | 無 Cookie 同意機制                              | `CookieNotice` banner（必要 cookie 告知型，localStorage 記住已讀）                                                                        |
| ① 功能 | 無 error / 404 頁                               | 新增`src/app/error.tsx`（含 digest、重試）＋ `not-found.tsx`                                                                            |
| ① 功能 | 落選應徵者收不到任何通知                        | 接受時通知其他落選者、婉拒時通知該老師（站內信）                                                                                            |
| ① 功能 | 認證審核結果只有站內信                          | 加寄 email（`notify` 新增 `system` 類，只看總開關）                                                                                     |
| ③ 效能 | jobs／論壇看板整表載入                          | jobs 列表分頁（12/頁，比照 tutors）；看板 take 100                                                                                          |
| ③ 效能 | ChatPoller 背景分頁照輪詢                       | `document.hidden` 時暫停，切回立即刷新                                                                                                    |
| ③ 效能 | 首頁／論壇圖片未優化                            | 換`next/image`；頭像 `<img>` 加 `loading="lazy"`（base64 來源，next/image 幫不上）                                                    |
| ⑥ 行動 | 主要按鈕觸控目標 ~28px                          | jobs/[id] 接受／婉拒、messages 標為已讀放大到 ≥40px                                                                                        |
| ② 內容 | `<html lang>`                                 | `zh-Hant` → `zh-TW`                                                                                                                    |

### D-2. 上線前需人工完成（程式做不了）

- [X] **Vercel 環境變數**：`GMAIL_USER`、`GMAIL_APP_PASSWORD`（沒設的話忘記密碼信「顯示已寄出但實際沒寄」）、`NEXT_PUBLIC_SITE_URL`（自訂網域）
- [ ] **GA4**：建立 GA4 資源後設 `NEXT_PUBLIC_GA_ID`
- [ ] **Google Search Console**：驗證網域（設 `NEXT_PUBLIC_GSC_VERIFICATION` 或 DNS）、提交 sitemap
- [ ] **法務覆核**：請律師看過（兩頁都有 ponytail 註記）
- [X] **實機測試**：手機／平板實測、跨瀏覽器（Safari/Chrome/Edge）、表單全流程含 email 收信
- [ ] **PageSpeed**：部署後跑 PageSpeed Insights 確認 ≥ 80
- [X] 若曾對正式 DB 跑過 seed：刪除或改密所有 `*@demo.com` 帳號D-3. 已知未做（排程／備忘）

- **CSP**：刻意延後（見 `next.config.ts` 註解），需 nonce 串 proxy.ts，建議先在測試環境掛 report-only
- **2FA**：至少 ADMIN 帳號應有第二因素；現階段以強密碼＋登入節流頂著
- **頭像/證件 base64 存 DB**：效能最大單一瓶頸（2MB 頭像 → 每個列表頁 ~2.7MB payload）；之後搬 Vercel Blob 或 R2，`avatarUrl` 欄位已相容外部網址
- **npm audit 4 moderate**：postcss XSS 內嵌於 next，實務不可觸發；等 next patch，**勿** `audit fix --force`（會降級 next）
- **快取**：全站每請求都打 DB；公開頁（首頁精選、行情統計）之後可加 `revalidate`
- **stats / admin market 整表載入**：現階段量小沒差，tutor/job 破千筆時要改聚合查詢
- **測試**：僅 3 支純函式自檢（`npx tsx src/lib/*.test.ts`），server actions／auth 零覆蓋；要加就從 auth actions 開始
