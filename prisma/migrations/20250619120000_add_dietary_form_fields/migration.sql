-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "updateRequestedAt" TIMESTAMP(3);
ALTER TABLE "StudentProfile" ADD COLUMN "medicalNotes" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "emergencyFoodContactName" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN "emergencyFoodContactPhone" TEXT;
