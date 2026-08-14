import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"

/** Meal price used to determine whether a student account can cover today's lunch. */
export const STUDENT_MEAL_PRICE = STUDENT_LUNCH_PRICE

/** Balance must meet or exceed meal price; amount is never exposed to teachers. */
export function isLowFunds(balance: number, mealPrice = STUDENT_MEAL_PRICE): boolean {
  return balance < mealPrice
}
