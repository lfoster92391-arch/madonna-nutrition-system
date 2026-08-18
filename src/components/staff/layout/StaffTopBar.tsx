"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Bell, ChevronDown, Menu, MessageSquare, User } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { PortalRoleSwitcher } from "@/components/auth/PortalRoleSwitcher"
import { useStaffData } from "@/components/providers/StaffDataProvider"
import { useStaffLayout } from "@/components/staff/layout/staff-layout-context"
import { SCHOOL } from "@/config/school"
import {
  STAFF_BG,
  STAFF_DANGER,
  STAFF_NAVY,
  STAFF_SILVER,
} from "@/components/staff/layout/staff-theme"

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

export function StaffTopBar() {
  const { user } = useAuth()
  const { profile } = useStaffData()
  const { setMobileSidebarOpen } = useStaffLayout()
  const staffName = profile?.displayName ?? user?.displayName ?? "Staff"
  const firstName = staffName.split(" ")[0] ?? staffName
  const today = useMemo(() => formatToday(), [])

  return (
    <header
      className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 sm:min-h-[68px] sm:gap-3 sm:px-4 md:px-6"
      style={{ borderColor: STAFF_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <button
        type="button"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition hover:bg-[#0A1E3F]/5 md:hidden"
        style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
        aria-label="Open menu"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 basis-[calc(100%-7rem)] sm:basis-auto">
        <p className="text-sm font-semibold leading-snug sm:text-base" style={{ color: STAFF_NAVY }}>
          <span className="md:hidden">Welcome, {firstName}</span>
          <span className="hidden md:inline">Welcome back, {staffName}</span>
        </p>
        <p className="hidden text-sm sm:block" style={{ color: STAFF_SILVER }}>
          Here&apos;s what&apos;s happening with lunch today.
        </p>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium shadow-sm"
          style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
        >
          {SCHOOL.name}
          <ChevronDown className="h-4 w-4" style={{ color: STAFF_SILVER }} />
        </button>
        <span
          className="rounded-2xl px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: STAFF_BG, color: STAFF_NAVY }}
        >
          {today}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <PortalRoleSwitcher />
        <TopBarIconButton icon={Bell} label="Notifications" />
        <Link href="/staff/messages">
          <TopBarIconButton icon={MessageSquare} label="Messages" />
        </Link>
        <Link
          href="/staff/settings"
          className="flex min-h-11 items-center gap-2 rounded-2xl border px-2 shadow-sm transition hover:bg-[#0A1E3F]/5 sm:px-3"
          style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
          aria-label="Staff profile"
        >
          <User className="h-4 w-4" />
          <span className="hidden lg:inline">{firstName}</span>
        </Link>
      </div>
    </header>
  )
}

function TopBarIconButton({
  icon: Icon,
  label,
  badge,
}: {
  icon: typeof Bell
  label: string
  badge?: number
}) {
  return (
    <button
      type="button"
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-2xl border shadow-sm transition hover:bg-[#0A1E3F]/5"
      style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {badge ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: STAFF_DANGER }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}
