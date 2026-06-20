"use client"

import Link from "next/link"
import { getTimeGreeting, PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type ParentHeroProps = {
  parentName: string
  studentsActive: number
  accountBalance: number
  actionsRequired: number
  reviewHref: string
  onAddFunds?: () => void
}

export function ParentHero({
  parentName,
  studentsActive,
  accountBalance,
  actionsRequired,
  reviewHref,
  onAddFunds,
}: ParentHeroProps) {
  const greeting = getTimeGreeting()

  return (
    <section className={`${PARENT_CARD} px-6 py-8 md:px-8 md:py-10`} style={{ minHeight: "180px" }}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
            {greeting}, {parentName}
          </h2>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:text-base">
            <Stat label="Students Active" value={String(studentsActive)} />
            <span className="hidden text-[#C8CDD7] sm:inline" aria-hidden>
              |
            </span>
            <Stat label="Account Balance" value={formatCurrency(accountBalance)} />
            <span className="hidden text-[#C8CDD7] sm:inline" aria-hidden>
              |
            </span>
            <Stat
              label="Actions Required"
              value={String(actionsRequired)}
              highlight={actionsRequired > 0}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            className="h-11 rounded-[10px] px-6 text-sm font-semibold"
            style={{ backgroundColor: PARENT_NAVY }}
          >
            <Link href={reviewHref}>Update Dietary Forms</Link>
          </Button>
          {onAddFunds ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-[10px] border-[#C8CDD7] px-6 text-sm font-semibold"
              style={{ color: PARENT_NAVY }}
              onClick={onAddFunds}
            >
              Add Funds
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-[10px] border-[#C8CDD7] px-6 text-sm font-semibold"
              style={{ color: PARENT_NAVY }}
            >
              <Link href="/parent/add-funds">Add Funds</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <p className="text-[#64748B]">
      <span className="font-medium">{label}:</span>{" "}
      <span
        className="font-bold tabular-nums"
        style={{ color: highlight ? "#DC2626" : PARENT_NAVY }}
      >
        {value}
      </span>
    </p>
  )
}
