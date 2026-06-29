-- AlterTable：時薪／預算改為區間，新增上限欄位（原欄位作為下限）
ALTER TABLE "TutorProfile" ADD COLUMN     "hourlyRateMax" INTEGER;
ALTER TABLE "JobPost" ADD COLUMN     "budgetMax" INTEGER;
