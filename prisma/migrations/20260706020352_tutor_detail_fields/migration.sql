-- 老師檔案詳細欄位：成績、客製時薪、可配合上課時間
ALTER TABLE "TutorProfile" ADD COLUMN "exams" JSONB;
ALTER TABLE "TutorProfile" ADD COLUMN "rateRules" JSONB;
ALTER TABLE "TutorProfile" ADD COLUMN "availability" JSONB;
