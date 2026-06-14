"use client"

import { formatCurrency } from "@/lib/utils"
import { formatTransactionDate } from "@/lib/parent-transactions"
import type { Transaction } from "@/lib/types"

type MealPurchasesTableProps = {
  transactions: Transaction[]
  showStudent?: boolean
  emptyMessage?: string
}

export function MealPurchasesTable({
  transactions,
  showStudent = false,
  emptyMessage = "No meal purchases in this period.",
}: MealPurchasesTableProps) {
  if (transactions.length === 0) {
    return <p className="py-8 text-center text-sm text-silver-foreground">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="border-b border-silver/40 bg-silver/10 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold text-primary md:px-6">Date</th>
            {showStudent && (
              <th className="px-4 py-3 font-semibold text-primary md:px-6">Student</th>
            )}
            <th className="px-4 py-3 font-semibold text-primary md:px-6">Meal</th>
            <th className="px-4 py-3 text-right font-semibold text-primary md:px-6">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b border-silver/20 last:border-0">
              <td className="px-4 py-3 text-silver-foreground md:px-6">
                {formatTransactionDate(tx.timestamp)}
              </td>
              {showStudent && (
                <td className="px-4 py-3 font-medium text-primary md:px-6">{tx.studentName}</td>
              )}
              <td className="px-4 py-3 text-silver-foreground md:px-6">{tx.meal}</td>
              <td className="px-4 py-3 text-right font-bold tabular-nums text-primary md:px-6">
                −{formatCurrency(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
