"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Wallet } from "lucide-react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import {
  filterByPeriod,
  filterByStudent,
  formatTransactionDate,
  type MealPeriodFilter,
} from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"
import {
  type ActivityCategory,
  getTransactionCategory,
  getTransactionTypeLabel,
} from "./payment-helpers"

type PaymentsActivityTabProps = {
  onAddFunds: () => void
}

const CATEGORY_OPTIONS: { value: ActivityCategory; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "meal", label: "Meal Purchase" },
  { value: "deposit", label: "Deposit" },
  { value: "refund", label: "Refund" },
  { value: "adjustment", label: "Adjustment" },
]

const PERIOD_OPTIONS: { value: MealPeriodFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Past 7 days" },
  { value: "month", label: "Past 30 days" },
]

export function PaymentsActivityTab({ onAddFunds }: PaymentsActivityTabProps) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") as ActivityCategory | null

  const { linkedStudents, familyTransactions, isLoading } = useParentTransactions()
  const [studentFilter, setStudentFilter] = useState<string>("all")
  const [periodFilter, setPeriodFilter] = useState<MealPeriodFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory>(
    initialCategory && CATEGORY_OPTIONS.some((o) => o.value === initialCategory)
      ? initialCategory
      : "all"
  )

  const filteredTransactions = useMemo(() => {
    let rows = filterByStudent(familyTransactions, studentFilter)
    rows = filterByPeriod(rows, periodFilter)
    if (categoryFilter !== "all") {
      rows = rows.filter((tx) => getTransactionCategory(tx) === categoryFilter)
    }
    return rows
  }, [familyTransactions, studentFilter, periodFilter, categoryFilter])

  if (isLoading) {
    return <p className="text-sm text-[#64748B]">Loading activity…</p>
  }

  return (
    <div className="space-y-4">
      <div className={`${PARENT_CARD} p-4 md:p-5`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <FilterField label="Student">
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="h-10 w-full rounded-[10px] border border-[#C8CDD7] bg-white px-3 text-sm"
              style={{ color: PARENT_NAVY }}
            >
              <option value="all">All students</option>
              {linkedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Date">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as MealPeriodFilter)}
              className="h-10 w-full rounded-[10px] border border-[#C8CDD7] bg-white px-3 text-sm"
              style={{ color: PARENT_NAVY }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Category">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ActivityCategory)}
              className="h-10 w-full rounded-[10px] border border-[#C8CDD7] bg-white px-3 text-sm"
              style={{ color: PARENT_NAVY }}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterField>
        </div>
      </div>

      <div className={`${PARENT_CARD} overflow-hidden`}>
        {filteredTransactions.length === 0 ? (
          <div className="px-4 py-10 text-center md:px-6">
            <p className="mx-auto max-w-md text-sm text-[#64748B]">
              No payment activity yet. Once your student begins purchasing meals or deposits are
              made, activity will appear here.
            </p>
            <Button
              type="button"
              className="mt-5 rounded-[10px]"
              style={{ backgroundColor: PARENT_NAVY }}
              onClick={onAddFunds}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Add Funds
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-[#C8CDD7] bg-[#041B52]/5 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Student
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Type
                  </th>
                  <th className="px-4 py-3 text-right font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type === "deposit"
                  return (
                    <tr key={tx.id} className="border-b border-[#C8CDD7]/60 last:border-0">
                      <td className="px-4 py-3 text-[#64748B] md:px-5">
                        {formatTransactionDate(tx.timestamp)}
                      </td>
                      <td className="px-4 py-3 font-medium md:px-5" style={{ color: PARENT_NAVY }}>
                        {tx.studentName}
                      </td>
                      <td className="px-4 py-3 text-[#64748B] md:px-5">
                        {getTransactionTypeLabel(tx)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-bold tabular-nums md:px-5 ${
                          isDeposit ? "text-success" : ""
                        }`}
                        style={!isDeposit ? { color: PARENT_NAVY } : undefined}
                      >
                        {isDeposit ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#64748B]">
        {label}
      </span>
      {children}
    </label>
  )
}
