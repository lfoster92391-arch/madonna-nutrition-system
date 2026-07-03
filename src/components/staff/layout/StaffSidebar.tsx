"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  ChevronLeft,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Settings,
  User,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { signOutAndRedirect } from "@/lib/auth/logout"
import { SCHOOL } from "@/config/school"
import { cn } from "@/lib/utils"
import { useStaffLayout } from "@/components/staff/layout/staff-layout-context"
import {
  STAFF_BG,
  STAFF_NAVY,
  STAFF_SIDEBAR_STORAGE_KEY,
  STAFF_SILVER,
} from "@/components/staff/layout/staff-theme"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/staff", icon: LayoutDashboard, exact: true },
  { label: "Lunch Calendar", href: "/staff/calendar", icon: Calendar },
  { label: "Announcements", href: "/staff/announcements", icon: Megaphone },
  { label: "Messages", href: "/staff/messages", icon: MessageSquare },
  { label: "My Account", href: "/staff/account", icon: User },
  { label: "Transactions", href: "/staff/transactions", icon: CreditCard },
  { label: "Settings", href: "/staff/settings", icon: Settings },
  { label: "Help", href: "/staff/help", icon: HelpCircle },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function StaffSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { mobileSidebarOpen, setMobileSidebarOpen } = useStaffLayout()
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STAFF_SIDEBAR_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname, setMobileSidebarOpen])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(STAFF_SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  const closeMobile = () => setMobileSidebarOpen(false)

  return (
    <>
      {mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col border-r bg-white transition-[transform,width] duration-200 md:relative md:z-20 md:w-60 md:shrink-0 md:translate-x-0",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          !expanded && "md:w-[72px]"
        )}
        style={{ borderColor: STAFF_SILVER }}
      >
        <div
          className="flex h-14 items-center border-b px-3 sm:h-[68px]"
          style={{ borderColor: STAFF_SILVER }}
        >
          <Link
            href="/staff"
            className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
            onClick={closeMobile}
          >
            <Image
              src="/brand-logo.png"
              alt="Fuel The Dons"
              width={160}
              height={40}
              priority
              className={cn(
                "shrink-0 object-contain",
                expanded || mobileSidebarOpen ? "h-9 w-auto max-w-[140px] sm:h-10" : "h-9 w-9"
              )}
            />
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" style={{ color: STAFF_NAVY }} />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5 md:flex"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {expanded ? (
              <ChevronLeft className="h-4 w-4" style={{ color: STAFF_NAVY }} />
            ) : (
              <Menu className="h-4 w-4" style={{ color: STAFF_NAVY }} />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact)
            const showLabel = expanded || mobileSidebarOpen
            return (
              <Link
                key={label}
                href={href}
                title={!showLabel ? label : undefined}
                onClick={closeMobile}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition",
                  active ? "text-white shadow-sm" : "hover:bg-[#0A1E3F]/5"
                )}
                style={active ? { backgroundColor: STAFF_NAVY } : { color: STAFF_NAVY }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showLabel && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => signOutAndRedirect("staff", logout)}
            title={!expanded && !mobileSidebarOpen ? "Logout" : undefined}
            className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium transition hover:bg-[#0A1E3F]/5"
            style={{ color: STAFF_NAVY }}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {(expanded || mobileSidebarOpen) && <span>Logout</span>}
          </button>
        </nav>

        <div className="border-t p-3" style={{ borderColor: STAFF_SILVER }}>
          {expanded || mobileSidebarOpen ? (
            <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: STAFF_BG }}>
              <p className="text-xs font-semibold" style={{ color: STAFF_NAVY }}>
                Madonna Nutrition System
              </p>
              <p className="mt-0.5 text-[10px]" style={{ color: STAFF_SILVER }}>
                {SCHOOL.name}
              </p>
              <p className="mt-1 text-[10px]" style={{ color: STAFF_SILVER }}>
                © 2025 Fuel The Dons
              </p>
            </div>
          ) : (
            <div
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: STAFF_NAVY }}
            >
              M
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
