-- AlterTable
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Student_schoolId_email_key" ON "Student"("schoolId", "email");
