-- AlterTable
ALTER TABLE "CalendarEvent" ADD COLUMN "mealTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "MealTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
