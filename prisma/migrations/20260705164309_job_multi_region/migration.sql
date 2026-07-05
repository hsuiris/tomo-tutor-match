-- 案件地區改多選：region(String) → regions(String[])，保留既有資料
ALTER TABLE "JobPost" ADD COLUMN "regions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "JobPost" SET "regions" = ARRAY["region"];
ALTER TABLE "JobPost" DROP COLUMN "region";
