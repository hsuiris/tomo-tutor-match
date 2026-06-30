-- 每則評價記錄「被評價者當下的身分」：當老師(true) 或當學生(false)
-- 讓老師評分與學生評分各自獨立統計，好學生 ≠ 好老師，互不污染。
-- 既有資料預設 true（沿用原本全部計入老師評分的行為，數字不變）。
ALTER TABLE "Review" ADD COLUMN "revieweeAsTutor" BOOLEAN NOT NULL DEFAULT true;

-- 唯一鍵改為「同一對象、同一身分」各一次：支援反轉關係（我的老師變我的學生）各評一次
DROP INDEX "Review_revieweeId_authorId_key";
CREATE UNIQUE INDEX "Review_revieweeId_authorId_revieweeAsTutor_key" ON "Review"("revieweeId", "authorId", "revieweeAsTutor");
