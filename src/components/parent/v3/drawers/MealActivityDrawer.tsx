"use client"

import { useMemo, useState } from "react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { MealPurchasesTable } from "@/components/parent/meals/MealPurchasesTable"
import { ParentDrawerShell } from "@/components/parent/v3/ParentDrawerShell"
import { V3_NAVY } from "@/components/parent/v3/parent-v3-theme"

type MealActivityDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MealActivityDrawer({ open, onOpenChange }: MealActivityDrawerProps) {
  const { linkedStudents, getFilteredMeals, isLoading } = useParentTransactions()
  const [studentFilter, setStudentFilter] = useState<string>("all")

  const filteredMeals = useMemo(
    () => getFilteredMeals(studentFilter, "month"),
    [getFilteredMeals, studentFilter]
  )

  return (
    <ParentDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Meal Activity"
      description="Recent meal purchases for your linked students."
      wide
    >
      {isLoading ? (
        <p className="text-sm text-[#64748B]">Loading meal activity…</p>
      ) : (
        <div className="space-y-5">
          <div>
            <label htmlFor="meal-student-filter" className="text-sm font-semibold" style={{ color: V3_NAVY }}>
              Filter by student
            </label>
            <select
              id="meal-student-filter"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="mt-2 h-11 w-full rounded-[12px] border border-[#C7CCD6] bg-white px-4 text-sm font-medium"
              style={{ color: V3_NAVY }}
            >
              <option value="all">All students</option>
              {linkedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-[16px] border border-[#C7CCD6]">
            <MealPurchasesTable
              transactions={filteredMeals.slice(0, 25)}
              showStudent={studentFilter === "all"}
            />
          </div>
        </div>
      )}
    </ParentDrawerShell>
  )
}
