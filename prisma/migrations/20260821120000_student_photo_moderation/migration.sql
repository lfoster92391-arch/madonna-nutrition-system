-- Parent-uploaded lunch badge photos require admin approve/deny.
CREATE TYPE "PhotoModerationStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'DENIED');

ALTER TABLE "Student" ADD COLUMN "photoStatus" "PhotoModerationStatus" NOT NULL DEFAULT 'NONE';

-- Existing on-file photos were already in use for badges — treat as approved.
UPDATE "Student"
SET "photoStatus" = 'APPROVED'
WHERE "photo" IS NOT NULL AND TRIM("photo") <> '';
