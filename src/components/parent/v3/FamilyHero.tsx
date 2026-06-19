"use client"

import { formatCurrency } from "@/lib/utils"
import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import { cn } from "@/lib/utils"

type FamilyHeroProps = {
  parentName: string
  familyBalance: number
  studentsCount: number
  actionNeeded: number
  onViewStudents: () => void
  onAddFunds: () => void
  onViewAlerts: () => void
}

function SummaryCard({
  label,
  value,
  highlight = false,
  onClick,
}: {
  label: string
  value: string
  highlight?: boolean
  onClick?: () => void
}) {
  const Tag = onClick ? "button" : "div"

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        V3_CARD,
        V3_CARD_BORDER,
        "flex min-h-[88px] flex-col justify-center px-4 py-3 text-left transition",
        onClick && "cursor-pointer hover:border-[#041B52]/30 hover:bg-[#041B52]/[0.02]"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p
        className="mt-1 text-xl font-bold tabular-nums md:text-2xl"
        style={{ color: highlight ? "#EA580C" : V3_NAVY }}
      >
        {value}
      </p>
    </Tag>
  )
}

export function FamilyHero({
  parentName,
  familyBalance,
  studentsCount,
  actionNeeded,
  onViewStudents,
  onAddFunds,
  onViewAlerts,
}: FamilyHeroProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: V3_NAVY }}>
          Welcome back, {parentName}
        </h1>
        <p className="text-base text-[#64748B] md:text-lg">
          Here&apos;s what&apos;s happening with your family today.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <HeroAction label="View Students" onClick={onViewStudents} />
          <HeroAction label="Add Funds" onClick={onAddFunds} primary />
          <HeroAction label="View Alerts" onClick={onViewAlerts} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <SummaryCard label="Family Balance" value={formatCurrency(familyBalance)} onClick={onAddFunds} />
        <SummaryCard label="Students" value={String(studentsCount)} onClick={onViewStudents} />
        <SummaryCard
          label="Action Needed"
          value={String(actionNeeded)}
          highlight={actionNeeded > 0}
          onClick={onViewAlerts}
        />
      </div>
    </section>
  )
}

function HeroAction({
  label,
  onClick,
  primary = false,
}: {
  label: string
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 min-w-[44px] rounded-[12px] px-4 text-sm font-semibold transition",
        primary
          ? "text-white hover:opacity-90"
          : "border border-[#C7CCD6] bg-white hover:bg-[#041B52]/5"
      )}
      style={primary ? { backgroundColor: V3_NAVY, color: "white" } : { color: V3_NAVY }}
    >
      {label}
    </button>
  )
}
