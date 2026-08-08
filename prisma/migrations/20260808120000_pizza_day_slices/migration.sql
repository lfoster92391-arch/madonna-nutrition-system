-- Pizza Day slice ordering fields on parent and staff/teacher lunch reservations

ALTER TABLE "TeacherLunchReservation" ADD COLUMN IF NOT EXISTS "sliceCount" INTEGER;
ALTER TABLE "TeacherLunchReservation" ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(10,2);
ALTER TABLE "TeacherLunchReservation" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2);

ALTER TABLE "LunchReservation" ADD COLUMN IF NOT EXISTS "sliceCount" INTEGER;
ALTER TABLE "LunchReservation" ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(10,2);
ALTER TABLE "LunchReservation" ADD COLUMN IF NOT EXISTS "totalAmount" DECIMAL(10,2);
