# 監控與告警（Vercel + Neon）

對應 [DEPLOYMENT.md](./DEPLOYMENT.md) Phase 3「設定監控與告警」。
分兩部分：**程式碼已埋的訊號**（本 repo 內）＋**儀表板要手動設的告警**（無法用程式碼代設）。

---

## A. 程式碼已埋好的訊號

| 訊號 | 位置 | 說明 |
| ---- | ---- | ---- |
| Web Analytics | `src/app/layout.tsx`（`<Analytics />`） | `@vercel/analytics`，需在 Vercel 專案開啟 Web Analytics |
| 登入失敗（密碼錯誤） | `src/app/(auth)/actions.ts` | stderr：`[login-failure] reason=bad-credentials ip=…` |
| 登入失敗（速率限制觸發） | 同上 | stderr：`[login-failure] reason=rate-limited ip=…` |

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

- **Error tracking（Sentry 等）**：目前只有 `console.error`/`warn` 進 Vercel logs。流量上來、要追前後端例外堆疊時再接 Sentry。— ponytail: YAGNI 到有量再加。
- **Uptime 監控**：免費可用 Better Stack / UptimeRobot 戳首頁，掉線寄信。
