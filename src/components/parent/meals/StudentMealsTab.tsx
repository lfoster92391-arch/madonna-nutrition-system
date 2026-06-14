"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { MealPurchasesTable } from "@/components/parent/meals/MealPurchasesTable"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MealPeriodFilter } from "@/lib/parent-transactions"

const PERIOD_OPTIONS: { value: MealPeriodFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

const PREVIEW_LIMIT = 8

type StudentMealsTabProps = {
  studentId: string
  studentName: string
}

export function StudentMealsTab({ studentId, studentName }: StudentMealsTabProps) {
  const { getStudentMeals, isLoading } = useParentTransactions()
  const [period, setPeriod] = useState<MealPeriodFilter>("week")
  const [showFullHistory, setShowFullHistory] = useState(false)

  const filteredMeals = useMemo(
    () => getStudentMeals(studentId, period),
    [getStudentMeals, studentId, period]
  )

  const visibleMeals = showFullHistory ? filteredMeals : filteredMeals.slice(0, PREVIEW_LIMIT)

  if (isLoading) {
    return <p className="text-sm text-silver-foreground">Loading meal history…</p>
  }

  return (
    <Card className="rounded-[20px] p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary">Recent Purchases</h3>
          <p className="mt-1 text-sm text-silver-foreground">
            Meal charges for {studentName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setPeriod(value)
                setShowFullHistory(false)
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                period === value
                  ? "bg-primary text-white"
                  : "border border-silver/60 text-silver-foreground hover:border-primary/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[14px] border border-silver/40">
        <MealPurchasesTable transactions={visibleMeals} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {filteredMeals.length > PREVIEW_LIMIT && !showFullHistory && (
          <Button type="button" variant="outline" onClick={() => setShowFullHistory(true)}>
            View Full History
          </Button>
        )}
        {showFullHistory && filteredMeals.length > PREVIEW_LIMIT && (
          <Button type="button" variant="ghost" onClick={() => setShowFullHistory(false)}>
            Show Less
          </Button>
        )}
        <Button asChild variant="ghost" className="h-auto min-h-0 px-0 text-primary underline-offset-4 hover:underline">
          <Link href="/parent/payments?tab=activity&category=meal">View in Payments</Link>
        </Button>
      </div>
    </Card>
  )
}
