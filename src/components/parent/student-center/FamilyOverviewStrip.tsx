"use client"

import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatCurrency } from "@/lib/utils"

type FamilyOverviewStripProps = {
  familyBalance: number
  studentsActive: number
  monthlySpend: number
  pendingReviews: number
}

export function FamilyOverviewStrip({
  familyBalance,
  studentsActive,
  monthlySpend,
  pendingReviews,
}: FamilyOverviewStripProps) {
  const stats = [
    { label: "Family Balance", value: formatCurrency(familyBalance) },
    { label: "Students Active", value: String(studentsActive) },
    { label: "Monthly Spend", value: formatCurrency(monthlySpend) },
    {
      label: "Pending Reviews",
      value: String(pendingReviews),
      highlight: pendingReviews > 0,
    },
  ]

  return (
    <section
      className={`${PARENT_CARD} grid grid-cols-2 gap-4 p-6 md:grid-cols-4`}
      aria-label="Family overview"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="text-center md:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">{stat.label}</p>
          <p
            className="mt-1 text-xl font-bold tabular-nums md:text-2xl"
            style={{ color: stat.highlight ? "#DC2626" : PARENT_NAVY }}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </section>
  )
}
