-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "parentNeeds" TEXT,
ADD COLUMN     "studentStatus" TEXT;

-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN     "eduLevel" TEXT,
ADD COLUMN     "university" TEXT;
