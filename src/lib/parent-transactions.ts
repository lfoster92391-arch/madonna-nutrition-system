import type { Transaction } from "@/lib/types"

export type MealPeriodFilter = "today" | "week" | "month" | "all"

export function isMealTransaction(tx: Transaction): boolean {
  return tx.type !== "deposit"
}

export function isDepositTransaction(tx: Transaction): boolean {
  return tx.type === "deposit"
}

export function sortTransactionsNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

export function filterByStudent(
  transactions: Transaction[],
  studentId: string | "all"
): Transaction[] {
  if (studentId === "all") return transactions
  return transactions.filter((tx) => tx.studentId === studentId)
}

export function filterByPeriod(
  transactions: Transaction[],
  period: MealPeriodFilter
): Transaction[] {
  if (period === "all") return transactions

  const now = new Date()
  const start = new Date(now)

  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "week") {
    start.setDate(now.getDate() - 7)
  } else {
    start.setMonth(now.getMonth() - 1)
  }

  return transactions.filter((tx) => new Date(tx.timestamp) >= start)
}

export function formatTransactionDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatTransactionDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString()
}
