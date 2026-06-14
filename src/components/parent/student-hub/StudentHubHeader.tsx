"use client"

import { useMemo, useState } from "react"
import { Filter, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type StudentHubHeaderProps = {
  parentName: string
  studentCount: number
  familyBalance: number
  actionsNeeded: number
  searchQuery: string
  onSearchChange: (value: string) => void
  filterStatus: FilterStatus
  onFilterChange: (value: FilterStatus) => void
}

export type FilterStatus = "all" | "action" | "low-balance"

export function StudentHubHeader({
  parentName,
  studentCount,
  familyBalance,
  actionsNeeded,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
}: StudentHubHeaderProps) {
  const [filterOpen, setFilterOpen] = useState(false)

  const filterLabel = useMemo(() => {
    if (filterStatus === "action") return "Action Needed"
    if (filterStatus === "low-balance") return "Low Balance"
    return "All Students"
  }, [filterStatus])

  return (
    <header className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: PARENT_NAVY }}>
            Student Profiles
          </p>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
            Welcome back, {parentName}
          </h1>
          <p className="max-w-2xl text-sm text-[#64748B] md:text-base">
            Select a student to view meals, balances, nutrition preferences, and account activity.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <SummaryPill>👨‍🎓 {studentCount} Students</SummaryPill>
            <SummaryPill>💳 Family Balance: {formatCurrency(familyBalance)}</SummaryPill>
            <SummaryPill highlight={actionsNeeded > 0}>
              ⚠ {actionsNeeded} Action{actionsNeeded === 1 ? "" : "s"} Needed
            </SummaryPill>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <div className="relative w-full min-w-[200px] sm:w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Students"
              className="h-10 rounded-[10px] border-[#C8CDD7] pl-9 text-sm"
            />
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-[10px] border-[#C8CDD7] text-sm font-semibold"
              style={{ color: PARENT_NAVY }}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <Filter className="h-4 w-4" />
              {filterLabel}
            </Button>
            {filterOpen && (
              <div className="absolute right-0 z-10 mt-2 w-44 rounded-[10px] border border-[#C8CDD7] bg-white py-1 shadow-md">
                {(
                  [
                    ["all", "All Students"],
                    ["action", "Action Needed"],
                    ["low-balance", "Low Balance"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      "block w-full px-4 py-2 text-left text-sm hover:bg-[#041B52]/5",
                      filterStatus === value && "font-semibold"
                    )}
                    style={{ color: PARENT_NAVY }}
                    onClick={() => {
                      onFilterChange(value)
                      setFilterOpen(false)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            disabled
            className="h-10 gap-2 rounded-[10px] text-sm font-semibold opacity-60"
            style={{ backgroundColor: PARENT_NAVY }}
            title="Coming soon"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>
    </header>
  )
}

function SummaryPill({
  children,
  highlight = false,
}: {
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold md:text-sm",
        highlight
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-[#C8CDD7] bg-white text-[#041B52]"
      )}
    >
      {children}
    </span>
  )
}
