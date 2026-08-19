-- Milk extras are $1.00. Pizza Day slice and MAIN lunch prices are unchanged.
ALTER TABLE "OnboardingPricing" ALTER COLUMN "milkPrice" SET DEFAULT 1.00;
UPDATE "OnboardingPricing" SET "milkPrice" = 1.00;
ALTER TYPE "LunchReservationMealType" ADD VALUE 'JUICE';
