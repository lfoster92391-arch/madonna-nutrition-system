import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"
import {
  isPizzaDayName,
  resolveMainMealPricing,
  type ResolvedMealPricing,
} from "@/lib/pizza-day"

export { STUDENT_LUNCH_PRICE }

/** Canonical MAIN lunch charge. Pizza Day stays $1.00 per slice. */
export function canonicalMainMealPricing(options: {
  menuTitle?: string | null
  sliceCount?: number | null
}): ResolvedMealPricing {
  return resolveMainMealPricing({
    menuTitle: options.menuTitle,
    sliceCount: options.sliceCount,
    fallbackPrice: STUDENT_LUNCH_PRICE,
  })
}

/**
 * Display/charge price for cookbook student or staff lunch.
 * Already-published templates keep showing $7 even if the stored row is older.
 * Pizza Day templates keep their stored per-slice price.
 */
export function displayTemplateLunchPrice(
  name: string,
  stored: number | null | undefined,
  category?: string
): number | undefined {
  if (isPizzaDayName(name)) {
    return stored != null ? Number(stored) : undefined
  }
  if (stored != null || category === "lunch") {
    return STUDENT_LUNCH_PRICE
  }
  return undefined
}

export function isMainLunchKioskMeal(meal: string, mealType?: string | null): boolean {
  if (mealType === "student_meal" || mealType === "staff_meal") return true
  const normalized = meal.trim().toLowerCase()
  return normalized === "student meal" || normalized === "staff meal"
}
