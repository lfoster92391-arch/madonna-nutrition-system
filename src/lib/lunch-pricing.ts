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

/** Extras / sides that must not move a lunch-line entry to Served by themselves. */
export function isNonLunchExtraCharge(mealLabel: string): boolean {
  const n = mealLabel.trim().toLowerCase()
  if (!n) return false
  if (
    n === "milk" ||
    n === "juice" ||
    n === "water" ||
    n === "side" ||
    n === "sides" ||
    n === "ala_carte" ||
    n === "a la carte" ||
    n === "à la carte" ||
    n.includes("ala carte") ||
    n.includes("a la carte") ||
    n.includes("à la carte")
  ) {
    return true
  }
  return false
}

/**
 * True when a ledger row means the student actually received today's lunch
 * (kiosk Student/Staff Meal, pizza/lunch labels, or office "money taken off" for lunch).
 */
export function isLunchLineServingCharge(input: {
  type: "MEAL" | "DEPOSIT" | string
  mealType: string
  amount: number
}): boolean {
  const label = input.mealType?.trim() ?? ""
  const amount = Number(input.amount)

  if (input.type === "MEAL") {
    if (isNonLunchExtraCharge(label)) return false
    if (isMainLunchKioskMeal(label)) return true
    const n = label.toLowerCase()
    if (/\b(student meal|staff meal|main lunch|main meal|pizza)\b/.test(n)) return true
    if (/\blunch\b/.test(n) && !isNonLunchExtraCharge(label)) return true
    return false
  }

  // Cashiers often charge forgotten-card / pizza lunch via "Take money off" (negative DEPOSIT).
  if (input.type === "DEPOSIT" && amount < 0) {
    const n = label.toLowerCase()
    if (!n.includes("money taken off")) return false
    if (/\b(lunch|pizza|meal|slice|forgot|card)\b/.test(n)) return true
    if (Math.abs(amount) === STUDENT_LUNCH_PRICE) return true
    return false
  }

  return false
}
