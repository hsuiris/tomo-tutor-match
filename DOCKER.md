# 🐳 用 Docker 沙盒啟動 TutorMatch

整個專案（Next.js 應用 + PostgreSQL）都跑在容器內，跟本機環境完全隔離，
不需要在電腦上安裝 Node 或 Postgres。

## 啟動

```bash
# 在 tutor-match/ 目錄下
docker compose up --build
```

第一次會建置 image（幾分鐘），之後啟動很快。完成後打開：

👉 **http://localhost:3300**

容器啟動時會自動：
1. 套用資料庫 migration（`prisma migrate deploy`）
2. 啟動 Next.js 正式版伺服器

> ⚠️ 容器**不會**自動灌示範資料。示範帳號密碼是公開的 `test1234`，
> 自動灌進正式環境等於開後門，所以已從啟動流程移除。
> 需要示範資料時，手動執行：`docker compose exec app npm run db:seed`
> （或本機 `npm run db:seed`）。**正式環境永遠不要跑 seed。**

## 示範帳號（僅限本機 / 沙盒，密碼都是 `test1234`）

| 身分 | Email |
|------|-------|
| 學生 | student@demo.com |
| 老師 | wang@demo.com（其餘 chen/lin/chang… @demo.com）|

## 常用指令

```bash
docker compose up -d        # 背景啟動
docker compose logs -f app  # 看應用日誌
docker compose down         # 停止並移除容器（資料保留在 volume）
docker compose down -v      # 連資料庫一起清空，回到全新狀態
docker compose up --build   # 改了程式後重建
```

## 設定

- **連接埠**：主機 `3300` → 容器 `3000`（避開本機其他佔用 3000 的服務，可在 `docker-compose.yml` 改）
- **資料庫**：容器內 `db` 服務，資料存在 `pgdata` volume，不會因容器重啟而消失
- **AUTH_SECRET**：正式上線請在啟動前設定環境變數，例如：
  ```bash
  AUTH_SECRET=$(openssl rand -base64 33) docker compose up -d
  ```

## 本機開發 vs Docker

- **Docker**（本檔）：`docker compose up`，跑在 3300，用容器內 Postgres
- **本機開發**：`npm run dev`，跑在 3100，用本機 Homebrew Postgres

兩者資料庫各自獨立、互不影響。
