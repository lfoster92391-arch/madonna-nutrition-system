"use client"

import Link from "next/link"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatCurrency } from "@/lib/utils"

export function InsightsRow() {
  const { familyTransactions, isLoading } = useParentTransactions()

  const recentActivity = familyTransactions.slice(0, 3).map((tx) => ({
    date: new Date(tx.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    description: tx.meal,
    amount: tx.type === "deposit" ? tx.amount : -tx.amount,
    student: tx.studentName,
  }))

  const monthlySpending = familyTransactions
    .filter((tx) => tx.type !== "deposit")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const spendingByWeek = [
    { week: "Week 1", amount: 0 },
    { week: "Week 2", amount: 0 },
    { week: "Week 3", amount: 0 },
    { week: "Week 4", amount: monthlySpending },
  ]

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
        Insights
      </h2>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className={`${PARENT_CARD} p-5 md:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
              Recent Activity
            </h3>
            <Link
              href="/parent/payments?tab=activity"
              className="text-sm font-semibold hover:underline"
              style={{ color: PARENT_NAVY }}
            >
              View All
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-[#64748B]">Loading activity…</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-[#64748B]">No transactions yet for your linked students.</p>
          ) : (
            <ul className="space-y-4">
              {recentActivity.map((item) => (
                <li
                  key={`${item.date}-${item.description}-${item.student}`}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium" style={{ color: PARENT_NAVY }}>
                      {item.description}
                    </p>
                    <p className="mt-0.5 text-[#64748B]">
                      {item.date} · {item.student}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-bold tabular-nums ${
                      item.amount > 0 ? "text-success" : ""
                    }`}
                    style={item.amount <= 0 ? { color: PARENT_NAVY } : undefined}
                  >
                    {item.amount > 0 ? `+${formatCurrency(item.amount)}` : formatCurrency(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${PARENT_CARD} p-5 md:p-6`}>
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Monthly Spending
          </h3>
          <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: PARENT_NAVY }}>
            {formatCurrency(monthlySpending)}
          </p>
          <div className="mt-4 h-40 md:h-44">
            {monthlySpending === 0 ? (
              <p className="text-sm text-[#64748B]">Spending trends appear after meal purchases.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByWeek} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} width={36} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="amount" fill={PARENT_NAVY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
