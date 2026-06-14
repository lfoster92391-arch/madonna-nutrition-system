import type { Transaction } from "@/lib/types"

export type ActivityCategory = "all" | "meal" | "deposit" | "refund" | "adjustment"

export function getTransactionCategory(tx: Transaction): Exclude<ActivityCategory, "all"> {
  if (tx.type === "deposit") return "deposit"
  const meal = tx.meal.toLowerCase()
  if (meal.includes("refund")) return "refund"
  if (meal.includes("adjust")) return "adjustment"
  return "meal"
}

export function getTransactionTypeLabel(tx: Transaction): string {
  const category = getTransactionCategory(tx)
  switch (category) {
    case "deposit":
      return "Deposit"
    case "refund":
      return "Refund"
    case "adjustment":
      return "Adjustment"
    default:
      return "Meal Purchase"
  }
}

export function isWithinCurrentMonth(timestamp: string): boolean {
  const date = new Date(timestamp)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  )
}
