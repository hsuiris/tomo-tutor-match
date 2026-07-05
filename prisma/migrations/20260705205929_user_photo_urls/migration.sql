-- 檔案照片牆（家長與老師皆可附照片，顯示於公開檔案頁）
ALTER TABLE "User" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
