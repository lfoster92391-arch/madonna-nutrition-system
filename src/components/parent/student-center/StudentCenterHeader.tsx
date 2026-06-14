"use client"

import { useRef, useState, useEffect } from "react"
import Link from "next/link"
import { ChevronDown, Filter, History, Search, ShieldAlert } from "lucide-react"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

type StudentCenterHeaderProps = {
  parentName: string
  studentCount: number
  familyBalance: number
  actionsNeeded: number
  searchQuery: string
  onSearchChange: (value: string) => void
  filterValue: string
  onFilterChange: (value: string) => void
}

const quickActionLinks = [
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Manage Allergies", href: "/parent/student-profile", icon: ShieldAlert },
]

export function StudentCenterHeader({
  parentName,
  studentCount,
  familyBalance,
  actionsNeeded,
  searchQuery,
  onSearchChange,
  filterValue,
  onFilterChange,
}: StudentCenterHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: PARENT_NAVY }}
          >
            Student Profiles
          </p>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
            Welcome back, {parentName}
          </h1>
          <p className="max-w-2xl text-sm text-[#64748B] md:text-base">
            View balances, manage nutrition preferences, review meal activity, and access student
            information.
          </p>
          <div className="flex flex-wrap gap-2">
            <SummaryChip>👨‍🎓 {studentCount} Students</SummaryChip>
            <SummaryChip>💳 Family Balance: {formatCurrency(familyBalance)}</SummaryChip>
            <SummaryChip highlight={actionsNeeded > 0}>
              ⚠ {actionsNeeded > 0 ? `${actionsNeeded} Action Needed` : "All Clear"}
            </SummaryChip>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[320px]">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search students"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 rounded-[14px] border-[#C8CDD7] pl-10 text-sm"
              aria-label="Search students"
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" aria-hidden />
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className="h-11 w-full appearance-none rounded-[14px] border border-[#C8CDD7] bg-white pl-10 pr-8 text-sm font-medium sm:w-[140px]"
              style={{ color: PARENT_NAVY }}
              aria-label="Filter students"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="low-balance">Low Balance</option>
              <option value="nutrition-review">Nutrition Review</option>
            </select>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-[14px] border border-[#C8CDD7] bg-white px-4 text-sm font-semibold transition hover:bg-[#041B52]/5 sm:w-[160px]"
              style={{ color: PARENT_NAVY }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              Quick Actions
              <ChevronDown className={cn("h-4 w-4 transition", menuOpen && "rotate-180")} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-52 rounded-[14px] border border-[#C8CDD7] bg-white py-2 shadow-lg"
              >
                {quickActionLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-[#041B52]/5"
                    style={{ color: PARENT_NAVY }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function SummaryChip({
  children,
  highlight = false,
}: {
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
        highlight
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-[#C8CDD7] bg-white text-[#64748B]"
      )}
    >
      {children}
    </span>
  )
}
