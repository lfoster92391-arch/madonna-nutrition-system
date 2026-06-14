/** Meal price used to determine whether a student account can cover today's lunch. */
export const STUDENT_MEAL_PRICE = 5.25

/** Balance must meet or exceed meal price; amount is never exposed to teachers. */
export function isLowFunds(balance: number, mealPrice = STUDENT_MEAL_PRICE): boolean {
  return balance < mealPrice
}
