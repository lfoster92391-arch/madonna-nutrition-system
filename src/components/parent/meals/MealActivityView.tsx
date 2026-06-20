"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { MealPurchasesTable } from "@/components/parent/meals/MealPurchasesTable"
import { FamilyOverviewStrip } from "@/components/parent/student-hub/FamilyOverviewStrip"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatCurrency } from "@/lib/utils"

const FAVORITE_MEALS_STUB: { meal: string; count: number }[] = []

export function MealActivityView() {
  const { linkedStudents, getFilteredMeals, isLoading } = useParentTransactions()
  const [studentFilter, setStudentFilter] = useState<string>("all")

  const filteredMeals = useMemo(
    () => getFilteredMeals(studentFilter, "month"),
    [getFilteredMeals, studentFilter]
  )

  const totalBalance = linkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const monthlySpend = filteredMeals.reduce((sum, tx) => sum + tx.amount, 0)
  const spendingByWeek = [{ week: "This month", amount: monthlySpend }]

  if (isLoading) {
    return <p className="p-8 text-silver-foreground">Loading meal activity…</p>
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Family</p>
        <h1 className="mt-2 text-2xl font-bold text-primary">Meal Activity</h1>
        <p className="mt-2 text-silver-foreground">
          Family-wide meal purchases, spending trends, and favorites.
        </p>
      </div>

      <FamilyOverviewStrip
        totalBalance={totalBalance}
        studentsActive={linkedStudents.length}
        pendingReviews={0}
        mealParticipation={92}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">Recent Meals</h2>
          <p className="text-sm text-silver-foreground">Filter by linked student</p>
        </div>
        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="h-11 rounded-[14px] border border-silver/60 bg-white px-4 text-sm font-medium text-primary"
          aria-label="Filter by student"
        >
          <option value="all">All students</option>
          {linkedStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden rounded-[20px] border-silver/60 shadow-sm">
        <MealPurchasesTable
          transactions={filteredMeals.slice(0, 20)}
          showStudent={studentFilter === "all"}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
          <h3 className="text-base font-bold text-primary">Monthly Spend</h3>
          <p className="mt-2 text-2xl font-bold tabular-nums text-primary">
            {formatCurrency(monthlySpend)}
          </p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingByWeek} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} width={36} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill={PARENT_NAVY} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
          <h3 className="text-base font-bold text-primary">Favorite Meals</h3>
          <p className="mt-1 text-sm text-silver-foreground">Based on purchase frequency</p>
          {FAVORITE_MEALS_STUB.length === 0 ? (
            <p className="mt-4 text-sm text-silver-foreground">Favorite meals appear after purchases are recorded.</p>
          ) : (
          <ul className="mt-4 space-y-3">
            {FAVORITE_MEALS_STUB.map(({ meal, count }) => (
              <li
                key={meal}
                className="flex items-center justify-between rounded-[12px] border border-silver/40 px-4 py-3"
              >
                <span className="font-medium text-primary">{meal}</span>
                <span className="text-sm text-silver-foreground">{count} purchases</span>
              </li>
            ))}
          </ul>
          )}
        </Card>
      </div>

      <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-primary">Export</h3>
            <p className="mt-1 text-sm text-silver-foreground">
              Download meal activity as CSV for your records (coming soon).
            </p>
          </div>
          <Button type="button" variant="outline" disabled>
            Export CSV
          </Button>
        </div>
      </Card>
    </div>
  )
}
