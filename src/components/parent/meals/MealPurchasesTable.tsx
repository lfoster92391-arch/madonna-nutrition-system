"use client"

import { formatCurrency } from "@/lib/utils"
import {
  formatMealLabel,
  formatTransactionDateTime,
} from "@/lib/parent-transactions"
import type { Transaction } from "@/lib/types"

type MealPurchasesTableProps = {
  transactions: Transaction[]
  showStudent?: boolean
  emptyMessage?: string
}

export function MealPurchasesTable({
  transactions,
  showStudent = false,
  emptyMessage = "No lunches yet this week.",
}: MealPurchasesTableProps) {
  if (transactions.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-silver-foreground">{emptyMessage}</p>
  }

  return (
    <>
      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-silver/30 md:hidden">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
            <div className="min-w-0">
              {showStudent && (
                <p className="truncate text-sm font-semibold text-primary">{tx.studentName}</p>
              )}
              <p className={`font-medium text-primary ${showStudent ? "mt-0.5" : ""}`}>
                {formatMealLabel(tx.meal)}
              </p>
              <p className="mt-0.5 text-xs text-silver-foreground">
                {formatTransactionDateTime(tx.timestamp)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold tabular-nums text-primary">
                −{formatCurrency(tx.amount)}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-silver-foreground">
                Bal. {formatCurrency(tx.balanceAfter)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="border-b border-silver/40 bg-silver/10 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-primary md:px-6">Date &amp; time</th>
              {showStudent && (
                <th className="px-4 py-3 font-semibold text-primary md:px-6">Student</th>
              )}
              <th className="px-4 py-3 font-semibold text-primary md:px-6">Meal</th>
              <th className="px-4 py-3 text-right font-semibold text-primary md:px-6">Amount</th>
              <th className="px-4 py-3 text-right font-semibold text-primary md:px-6">Balance</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-silver/20 last:border-0">
                <td className="px-4 py-3 text-silver-foreground md:px-6">
                  {formatTransactionDateTime(tx.timestamp)}
                </td>
                {showStudent && (
                  <td className="px-4 py-3 font-medium text-primary md:px-6">{tx.studentName}</td>
                )}
                <td className="px-4 py-3 text-silver-foreground md:px-6">
                  {formatMealLabel(tx.meal)}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums text-primary md:px-6">
                  −{formatCurrency(tx.amount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-silver-foreground md:px-6">
                  {formatCurrency(tx.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
