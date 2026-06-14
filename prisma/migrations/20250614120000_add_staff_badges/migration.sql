-- AlterTable
ALTER TABLE "User" ADD COLUMN "badgeId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "processedByUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_schoolId_badgeId_key" ON "User"("schoolId", "badgeId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_processedByUserId_fkey" FOREIGN KEY ("processedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
