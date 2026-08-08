/** Pizza Day special ordering: $1.00 per slice. */

export const PIZZA_SLICE_UNIT_PRICE = 1

export const MIN_PIZZA_SLICES = 1
export const MAX_PIZZA_SLICES = 10
export const DEFAULT_PIZZA_SLICES = 1

/** Case-insensitive match for "Pizza Day" in a meal/menu title. */
export function isPizzaDayName(name?: string | null): boolean {
  if (!name) return false
  return /\bpizza\s*day\b/i.test(name.trim())
}

export function clampPizzaSlices(count: number): number {
  if (!Number.isFinite(count)) return DEFAULT_PIZZA_SLICES
  return Math.min(MAX_PIZZA_SLICES, Math.max(MIN_PIZZA_SLICES, Math.floor(count)))
}

export function pizzaSliceTotal(
  sliceCount: number,
  unitPrice: number = PIZZA_SLICE_UNIT_PRICE
): number {
  const slices = clampPizzaSlices(sliceCount)
  return Math.round(slices * unitPrice * 100) / 100
}

export type PizzaPricing = {
  isPizzaDay: true
  sliceCount: number
  unitPrice: number
  totalAmount: number
}

export type StandardMealPricing = {
  isPizzaDay: false
  sliceCount: null
  unitPrice: null
  totalAmount: number
}

export type ResolvedMealPricing = PizzaPricing | StandardMealPricing

/** Resolve charge for a MAIN meal when the published menu may be Pizza Day. */
export function resolveMainMealPricing(options: {
  menuTitle?: string | null
  sliceCount?: number | null
  fallbackPrice: number
}): ResolvedMealPricing {
  if (isPizzaDayName(options.menuTitle)) {
    const sliceCount = clampPizzaSlices(options.sliceCount ?? DEFAULT_PIZZA_SLICES)
    const unitPrice = PIZZA_SLICE_UNIT_PRICE
    return {
      isPizzaDay: true,
      sliceCount,
      unitPrice,
      totalAmount: pizzaSliceTotal(sliceCount, unitPrice),
    }
  }

  return {
    isPizzaDay: false,
    sliceCount: null,
    unitPrice: null,
    totalAmount: options.fallbackPrice,
  }
}
