"use client"

import { useMemo } from "react"
import {
  Activity,
  Bell,
  ChevronDown,
  MessageSquare,
  User,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import {
  ADMIN_BG,
  ADMIN_DANGER,
  ADMIN_NAVY,
  ADMIN_SILVER,
  ADMIN_SUCCESS,
} from "@/components/admin/layout/admin-theme"

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

export function AdminTopBar() {
  const { user } = useAuth()
  const adminName = user?.displayName ?? "Administrator"
  const today = useMemo(() => formatToday(), [])

  return (
    <header
      className="flex h-[68px] shrink-0 items-center gap-4 border-b px-6"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold" style={{ color: ADMIN_NAVY }}>
          Welcome back, {adminName}
        </p>
        <p className="truncate text-sm" style={{ color: ADMIN_SILVER }}>
          Select a department to begin.
        </p>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium shadow-sm"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
        >
          {DEMO_SCHOOL.name}
          <ChevronDown className="h-4 w-4" style={{ color: ADMIN_SILVER }} />
        </button>
        <span
          className="rounded-2xl px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: ADMIN_BG, color: ADMIN_NAVY }}
        >
          {today}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TopBarIconButton icon={Bell} label="Notifications" badge={3} />
        <TopBarIconButton icon={MessageSquare} label="Messages" badge={1} />
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
          aria-label="Profile"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{adminName.split(" ")[0]}</span>
        </button>
        <div
          className="hidden items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium lg:flex"
          style={{ backgroundColor: ADMIN_BG, color: ADMIN_NAVY }}
          title="System Health"
        >
          <Activity className="h-3.5 w-3.5" style={{ color: ADMIN_SUCCESS }} />
          All systems operational
        </div>
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
      className="relative flex h-10 w-10 items-center justify-center rounded-2xl border shadow-sm transition hover:bg-[#0A1E3F]/5"
      style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
      {badge ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: ADMIN_DANGER }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}
