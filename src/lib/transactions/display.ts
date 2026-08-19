import { formatCurrency } from "@/lib/utils"

type AmountView = {
  type?: "meal" | "deposit"
  amount: number
}

export function isCreditDeposit(tx: AmountView): boolean {
  return tx.type === "deposit" && tx.amount >= 0
}

export function isMoneyTakenOff(tx: AmountView): boolean {
  return tx.type === "deposit" && tx.amount < 0
}

export function formatSignedTransactionAmount(tx: AmountView): string {
  if (tx.type === "deposit") {
    const abs = formatCurrency(Math.abs(tx.amount))
    return tx.amount >= 0 ? `+${abs}` : `−${abs}`
  }
  return `−${formatCurrency(Math.abs(tx.amount))}`
}

export function transactionListTypeLabel(tx: AmountView): string {
  if (isMoneyTakenOff(tx)) return "Money taken off"
  if (tx.type === "deposit") return "Deposit"
  return "Meal"
}
