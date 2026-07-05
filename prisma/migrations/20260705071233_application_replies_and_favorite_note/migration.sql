-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "ApplicationReply" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationReply_applicationId_idx" ON "ApplicationReply"("applicationId");

-- AddForeignKey
ALTER TABLE "ApplicationReply" ADD CONSTRAINT "ApplicationReply_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationReply" ADD CONSTRAINT "ApplicationReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
