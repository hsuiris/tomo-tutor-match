-- AlterTable：使用者通知偏好
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN     "notifyJobUpdates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN     "notifyMessages" BOOLEAN NOT NULL DEFAULT true;
