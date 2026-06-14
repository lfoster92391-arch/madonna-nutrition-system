"use client"

import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatCurrency } from "@/lib/utils"

type FamilyOverviewStripProps = {
  totalBalance: number
  studentsActive: number
  pendingReviews: number
  mealParticipation: number
}

export function FamilyOverviewStrip({
  totalBalance,
  studentsActive,
  pendingReviews,
  mealParticipation,
}: FamilyOverviewStripProps) {
  const stats = [
    { label: "Total Balance", value: formatCurrency(totalBalance) },
    { label: "Students Active", value: String(studentsActive) },
    { label: "Pending Reviews", value: String(pendingReviews) },
    { label: "Meal Participation", value: `${mealParticipation}%` },
  ]

  return (
    <section aria-label="Family overview">
      <div className={`${PARENT_CARD} grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 md:p-5`}>
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums md:text-xl" style={{ color: PARENT_NAVY }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
