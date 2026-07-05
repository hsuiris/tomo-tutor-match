-- 資料補齊：功能上線前就已存在的應徵，補建「已應徵自動入收藏」的收藏紀錄
-- （applyToJob 現在會在應徵當下 upsert 收藏；這裡處理歷史資料）
INSERT INTO "Favorite" ("id", "userId", "jobId", "createdAt")
SELECT gen_random_uuid()::text, tp."userId", a."jobId", a."createdAt"
FROM "Application" a
JOIN "TutorProfile" tp ON tp."id" = a."tutorId"
WHERE NOT EXISTS (
  SELECT 1 FROM "Favorite" f
  WHERE f."userId" = tp."userId" AND f."jobId" = a."jobId"
);
