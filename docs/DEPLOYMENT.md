# TutorMatch 上線文件（Vercel）

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

| 變數             | 值                                                                          |
| ---------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL` | Neon**pooled** 連線字串（建議 `?sslmode=require&pgbouncer=true`）   |
| `DIRECT_URL`   | Neon**direct（非 pooler）** 連線字串，供 `prisma migrate deploy` 用 |
| `AUTH_SECRET`  | `openssl rand -base64 33` 產生的**全新**金鑰                        |

⚠️ **重要**：

- 本機 `.env` 裡的 dev `AUTH_SECRET` 視為**已洩漏**，正式環境務必換新。
- Vercel **不會**讀你的 `.env`（已 gitignore），一定要在 dashboard 設。
- NextAuth v5 在 production 沒設 `AUTH_SECRET` 會直接啟動失敗；Vercel 會自動信任 host，**不需**額外設 `AUTH_TRUST_HOST`。

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

- [X] 移除容器自動 seed（`docker-entrypoint.sh`）
- [X] `AUTH_SECRET` 無不安全預設值（`docker-compose.yml`），正式用全新金鑰
- [X] 確認正式 DB **沒有**任何 `@demo.com` 帳號：
  ```sql
  SELECT email, role FROM "User" WHERE email LIKE '%@demo.com';  -- 應為 0 筆
  ```

### 🟠 Phase 1 — 建議修（已完成）

- [X] 登入/註冊速率限制
- [X] `avatarUrl` 只接受 `data:image/`
- [X] 證件影像審核後即清除（PII 最小化）

### 🟡 Phase 2 — 環境與部署

- [X] 安全標頭（HSTS / nosniff / X-Frame-Options / Referrer-Policy / Permissions-Policy）— `next.config.ts`
- [X] `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` 由 Vercel 環境注入（非寫死）
- [ ] DB 使用強密碼、**不對公網開放**（僅允許 Vercel / 受信任來源連線）
- [ ] 全站 HTTPS（Vercel 預設提供，確認自訂網域憑證 OK）
- [ ] `npm run build`、`npm run lint` 在 CI／本機通過
- [ ] preview deployment smoke test 通過（第 6 節）

### 🟢 Phase 3 — 上線後

- [ ] 開啟 DB **自動備份**（在 DB 供應商設定，確認可還原）
- [ ] 設定監控與告警：Vercel logs/analytics、DB 連線數、登入失敗率
- [ ] 補上**隱私權政策 / 個資蒐集同意 / 證件保存期限**（PDPA 合規，營運/法務）
- [ ] 規劃 CSP（在 `proxy.ts` 串 nonce 後啟用）
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
