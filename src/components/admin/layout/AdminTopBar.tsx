"use client"

import { useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  ChevronDown,
  Menu,
  MessageSquare,
  PanelRight,
  User,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { mockNotifications } from "@/data/mockNotifications"
import { useAdminLayout } from "@/components/admin/layout/admin-layout-context"
import {
  ADMIN_DANGER,
  ADMIN_NAVY,
  ADMIN_SILVER,
} from "@/components/admin/layout/admin-theme"

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

function formatRoleLabel(role: string) {
  if (role === "admin") return "System Administrator"
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function AdminTopBar() {
  const { user } = useAuth()
  const adminName = user?.displayName ?? "Admin User"
  const today = useMemo(() => formatToday(), [])
  const {
    setMobileSidebarOpen,
    setMobileRailOpen,
    utilityRailExpanded,
    setUtilityRailExpanded,
  } = useAdminLayout()
  const notificationCount = mockNotifications.length

  const openAlertsRail = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      if (!utilityRailExpanded) {
        setUtilityRailExpanded(true)
      }
    } else {
      setMobileRailOpen(true)
    }
  }, [setMobileRailOpen, setUtilityRailExpanded, utilityRailExpanded])

  return (
    <header
      className="flex h-[72px] shrink-0 items-center gap-2 border-b px-3 sm:gap-4 sm:px-4 md:px-6"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <button
        type="button"
        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm transition hover:bg-[#0A1E3F]/5 md:hidden"
        style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
        aria-label="Open menu"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Image
          src="/brand-logo.png"
          alt="Fuel The Dons"
          width={140}
          height={36}
          priority
          className="hidden h-9 w-auto max-w-[120px] shrink-0 object-contain sm:block md:max-w-[140px]"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold uppercase tracking-wide" style={{ color: ADMIN_NAVY }}>
            Fuel The Dons
          </p>
          <p className="hidden truncate text-[11px] font-medium sm:block" style={{ color: ADMIN_SILVER }}>
            Madonna Nutrition Management System
          </p>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center gap-3 lg:flex">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
        >
          {DEMO_SCHOOL.name}
          <ChevronDown className="h-4 w-4" style={{ color: ADMIN_SILVER }} />
        </button>
        <span
          className="rounded-xl border px-4 py-2 text-sm font-medium"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
        >
          {today}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border shadow-sm transition hover:bg-[#0A1E3F]/5 lg:hidden"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
          aria-label="Activity and alerts"
          onClick={() => setMobileRailOpen(true)}
        >
          <PanelRight className="h-4 w-4" />
        </button>
        <TopBarIconButton
          icon={Bell}
          label="Notifications"
          badge={notificationCount}
          onClick={openAlertsRail}
        />
        <Link href="/admin/communication">
          <TopBarIconButton icon={MessageSquare} label="Messages" />
        </Link>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2.5 rounded-xl border px-2 text-left shadow-sm sm:px-3"
          style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
          aria-label="Profile"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full"
            style={{ backgroundColor: `${ADMIN_NAVY}15` }}
          >
            <User className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
          </span>
          <span className="hidden min-w-0 md:block">
            <span className="block truncate text-sm font-semibold">{adminName}</span>
            <span className="block truncate text-[11px]" style={{ color: ADMIN_SILVER }}>
              {formatRoleLabel(user?.role ?? "admin")}
            </span>
          </span>
        </button>
      </div>
    </header>
  )
}

function TopBarIconButton({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: typeof Bell
  label: string
  badge?: number
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border shadow-sm transition hover:bg-[#0A1E3F]/5"
      style={{ borderColor: ADMIN_SILVER, color: ADMIN_NAVY }}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {badge && badge > 0 ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: ADMIN_DANGER }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  )
}
