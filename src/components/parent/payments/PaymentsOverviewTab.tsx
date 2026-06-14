"use client"

import { useMemo } from "react"
import { ArrowDownLeft, CreditCard, TrendingUp, Users, Wallet } from "lucide-react"
import { getSuggestedDeposit } from "@/components/parent/funding/useAddFundsPayment"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { formatTransactionDate } from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"
import { getTransactionTypeLabel, isWithinCurrentMonth } from "./payment-helpers"

type PaymentsOverviewTabProps = {
  onAddFunds: () => void
}

export function PaymentsOverviewTab({ onAddFunds }: PaymentsOverviewTabProps) {
  const { linkedStudents, familyTransactions, mealTransactions, depositTransactions, isLoading } =
    useParentTransactions()

  const familyBalance = linkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const lowBalanceStudents = linkedStudents.filter((s) => s.balance < 5)
  const suggestedDeposit = getSuggestedDeposit(linkedStudents)

  const monthlyDeposits = useMemo(
    () =>
      depositTransactions
        .filter((tx) => isWithinCurrentMonth(tx.timestamp))
        .reduce((sum, tx) => sum + tx.amount, 0),
    [depositTransactions]
  )

  const monthlySpend = useMemo(
    () =>
      mealTransactions
        .filter((tx) => isWithinCurrentMonth(tx.timestamp))
        .reduce((sum, tx) => sum + tx.amount, 0),
    [mealTransactions]
  )

  const avgLunchSpend = useMemo(() => {
    const meals = mealTransactions.filter((tx) => isWithinCurrentMonth(tx.timestamp))
    if (meals.length === 0) return 0
    return meals.reduce((sum, tx) => sum + tx.amount, 0) / meals.length
  }, [mealTransactions])

  const recentActivity = familyTransactions.slice(0, 4)

  if (isLoading) {
    return <p className="text-sm text-[#64748B]">Loading payment overview…</p>
  }

  return (
    <div className="space-y-4">
      <article
        className={`${PARENT_CARD} flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6`}
      >
        <div>
          <p className="text-sm font-semibold text-[#64748B]">Family Balance</p>
          <p
            className="mt-1 text-3xl font-bold tabular-nums md:text-4xl"
            style={{ color: PARENT_NAVY }}
          >
            {formatCurrency(familyBalance)}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {lowBalanceStudents.length > 0 ? (
              <span className="font-semibold text-danger">
                {lowBalanceStudents.length} student
                {lowBalanceStudents.length > 1 ? "s" : ""} need funds
              </span>
            ) : (
              <span className="text-[#64748B]">All accounts in good standing</span>
            )}
            <span className="text-[#64748B]">
              Monthly spend: {formatCurrency(monthlySpend)}
            </span>
          </div>
        </div>
        <Button
          type="button"
          className="h-11 shrink-0 rounded-[10px] px-6"
          style={{ backgroundColor: PARENT_NAVY }}
          onClick={onAddFunds}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Add Funds
        </Button>
      </article>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Family Balance"
          value={formatCurrency(familyBalance)}
          sub={
            lowBalanceStudents.length > 0
              ? `${lowBalanceStudents.length} low`
              : "Healthy"
          }
        />
        <SummaryCard
          icon={ArrowDownLeft}
          label="Monthly Deposits"
          value={formatCurrency(monthlyDeposits)}
          sub="This calendar month"
          positive
        />
        <SummaryCard
          icon={TrendingUp}
          label="Average Lunch Spend"
          value={formatCurrency(avgLunchSpend)}
          sub="Per purchase this month"
        />
        <SummaryCard
          icon={Users}
          label="Suggested Deposit"
          value={formatCurrency(suggestedDeposit)}
          sub="Based on low balances"
          positive
        />
      </div>

      <div className={`${PARENT_CARD} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#C8CDD7] px-4 py-3 md:px-5">
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Recent Activity
          </h3>
          <CreditCard className="h-4 w-4 text-[#64748B]" aria-hidden />
        </div>
        {recentActivity.length === 0 ? (
          <p className="p-5 text-sm text-[#64748B]">No recent payment activity.</p>
        ) : (
          <ul className="divide-y divide-[#C8CDD7]/60">
            {recentActivity.map((tx) => {
              const isDeposit = tx.type === "deposit"
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 md:px-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: PARENT_NAVY }}>
                      {getTransactionTypeLabel(tx)} · {tx.studentName}
                    </p>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      {formatTransactionDate(tx.timestamp)} · {tx.meal}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      isDeposit ? "text-success" : ""
                    }`}
                    style={!isDeposit ? { color: PARENT_NAVY } : undefined}
                  >
                    {isDeposit ? "+" : "−"}
                    {formatCurrency(tx.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
  positive = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  positive?: boolean
}) {
  return (
    <div className={`${PARENT_CARD} p-4 md:p-5`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#64748B]">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#041B52]/5">
          <Icon className="h-4 w-4 text-[#041B52]" />
        </span>
      </div>
      <p
        className={`mt-2 text-xl font-bold tabular-nums md:text-2xl ${
          positive ? "text-success" : ""
        }`}
        style={!positive ? { color: PARENT_NAVY } : undefined}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#64748B]">{sub}</p>
    </div>
  )
}
