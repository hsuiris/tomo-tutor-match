-- AlterEnum
ALTER TYPE "VerificationType" ADD VALUE 'EDUCATION';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "eduVerified" BOOLEAN NOT NULL DEFAULT false;
