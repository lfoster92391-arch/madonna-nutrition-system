"use client"

import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import { formatCurrency } from "@/lib/utils"

type FamilyOverviewStripProps = {
  totalBalance: number
  studentsActive: number
  pendingReviews: number
  participation: number
}

export function FamilyOverviewStrip({
  totalBalance,
  studentsActive,
  pendingReviews,
  participation,
}: FamilyOverviewStripProps) {
  const stats = [
    { label: "Total Balance", value: formatCurrency(totalBalance) },
    { label: "Students Active", value: String(studentsActive) },
    { label: "Pending Reviews", value: String(pendingReviews) },
    { label: "Participation", value: `${participation}%` },
  ]

  return (
    <section aria-label="Family overview">
      <div className={`${V3_CARD} ${V3_CARD_BORDER} grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 md:p-5`}>
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
            <p className="mt-1 text-lg font-bold tabular-nums md:text-xl" style={{ color: V3_NAVY }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
