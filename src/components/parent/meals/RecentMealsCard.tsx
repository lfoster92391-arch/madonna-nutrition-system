"use client"

import Link from "next/link"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatTransactionDate } from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"

export function RecentMealsCard() {
  const { mealTransactions, isLoading } = useParentTransactions()
  const recentMeals = mealTransactions.slice(0, 5)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold md:text-xl" style={{ color: PARENT_NAVY }}>
          Recent Meals
        </h2>
        <Link
          href="/parent/payments?tab=activity"
          className="text-sm font-semibold hover:underline"
          style={{ color: PARENT_NAVY }}
        >
          See All
        </Link>
      </div>

      <div className={`${PARENT_CARD} overflow-hidden`}>
        {isLoading ? (
          <p className="p-6 text-sm text-[#64748B]">Loading recent meals…</p>
        ) : recentMeals.length === 0 ? (
          <p className="p-6 text-sm text-[#64748B]">No recent meal purchases.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-[#C8CDD7] bg-[#041B52]/5 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold md:px-6" style={{ color: PARENT_NAVY }}>
                    Student
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-6" style={{ color: PARENT_NAVY }}>
                    Meal
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-6" style={{ color: PARENT_NAVY }}>
                    Date
                  </th>
                  <th className="px-4 py-3 text-right font-semibold md:px-6" style={{ color: PARENT_NAVY }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentMeals.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#C8CDD7]/60 last:border-0">
                    <td className="px-4 py-3 font-medium md:px-6" style={{ color: PARENT_NAVY }}>
                      {tx.studentName}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] md:px-6">{tx.meal}</td>
                    <td className="px-4 py-3 text-[#64748B] md:px-6">
                      {formatTransactionDate(tx.timestamp)}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-bold tabular-nums md:px-6"
                      style={{ color: PARENT_NAVY }}
                    >
                      −{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && recentMeals.length > 0 && (
          <div className="flex flex-wrap gap-4 border-t border-[#C8CDD7] px-4 py-3 md:px-6">
            <Link
              href="/parent/student-profile"
              className="text-sm font-semibold hover:underline"
              style={{ color: PARENT_NAVY }}
            >
              View by Student
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
