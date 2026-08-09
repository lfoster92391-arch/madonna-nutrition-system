"use client"

import { useMemo } from "react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import {
  filterByPeriod,
  formatMealLabel,
  formatTransactionDateTime,
} from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"

const PREVIEW_LIMIT = 12

export function RecentLunchesSection() {
  const { mealTransactions, linkedStudents, isLoading } = useParentTransactions()

  const weekLunches = useMemo(
    () => filterByPeriod(mealTransactions, "week").slice(0, PREVIEW_LIMIT),
    [mealTransactions]
  )

  const hasOlderLunches = mealTransactions.length > weekLunches.length
  const showStudent = linkedStudents.length > 1

  return (
    <section aria-label="Recent lunches">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between md:mb-6">
        <div>
          <h2 className="text-lg font-bold md:text-xl" style={{ color: V3_NAVY }}>
            Recent lunches
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            Scan and cafeteria purchases for your linked students this week.
          </p>
        </div>
      </div>

      <div className={`${V3_CARD} ${V3_CARD_BORDER} overflow-hidden`}>
        {isLoading ? (
          <p className="px-5 py-8 text-center text-sm text-[#64748B] md:px-6">
            Loading recent lunches…
          </p>
        ) : weekLunches.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#64748B] md:px-6">
            No lunches yet this week.
          </p>
        ) : (
          <ul className="divide-y divide-[#C7CCD6]">
            {weekLunches.map((tx) => (
              <li
                key={tx.id}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6"
              >
                <div className="min-w-0">
                  {showStudent && (
                    <p className="truncate text-sm font-semibold" style={{ color: V3_NAVY }}>
                      {tx.studentName}
                    </p>
                  )}
                  <p
                    className={`font-semibold ${showStudent ? "mt-0.5" : ""}`}
                    style={{ color: V3_NAVY }}
                  >
                    {formatMealLabel(tx.meal)}
                  </p>
                  <p className="mt-0.5 text-sm text-[#64748B]">
                    {formatTransactionDateTime(tx.timestamp)}
                  </p>
                </div>
                <div className="flex shrink-0 items-baseline justify-between gap-6 sm:flex-col sm:items-end sm:justify-center">
                  <p className="text-sm font-bold tabular-nums" style={{ color: V3_NAVY }}>
                    −{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs tabular-nums text-[#64748B]">
                    Balance {formatCurrency(tx.balanceAfter)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && hasOlderLunches && (
          <div className="border-t border-[#C7CCD6] px-5 py-3 md:px-6">
            <p className="text-xs text-[#64748B]">
              Showing this week&apos;s lunches. Open a student profile or Meal Activity for more history.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
