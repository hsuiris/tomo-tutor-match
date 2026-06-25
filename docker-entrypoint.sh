#!/bin/sh
set -e

echo "▶ 套用資料庫 migration..."
npx prisma migrate deploy

# 注意：絕對不要在這裡自動跑 seed。
# seed 會建立已知密碼的 admin/demo 帳號（test1234），灌進正式環境等同後門。
# 需要示範資料時，請在本機或測試環境手動執行：npm run db:seed
echo "▶ 啟動 Next.js..."
exec npm run start
