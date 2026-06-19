"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Brain,
  Calendar,
  ChevronLeft,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Settings,
  UtensilsCrossed,
  User,
  Wallet,
  Wrench,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"
import {
  ADMIN_NAVY,
  ADMIN_SIDEBAR_DARK,
  ADMIN_SIDEBAR_STORAGE_KEY,
  ADMIN_SILVER,
} from "@/components/admin/layout/admin-theme"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Launch", href: "/admin#get-started", icon: Rocket },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Operations", href: "/admin/receiving", icon: Wrench },
  { label: "Financials", href: "/admin/finance", icon: Wallet },
  { label: "Intelligence", href: "/admin/intelligence", icon: Brain, readOnly: true },
  { label: "Communication", href: "/admin/communication", icon: Megaphone },
  { label: "Reporting", href: "/admin/reporting", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Support", href: "/admin/support", icon: Headphones },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  const base = href.split("#")[0]
  return pathname === base || pathname.startsWith(`${base}/`)
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const adminName = user?.displayName ?? "Admin User"
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "relative z-20 flex shrink-0 flex-col text-white transition-[width] duration-200",
        expanded ? "w-60" : "w-[72px]"
      )}
      style={{ backgroundColor: ADMIN_SIDEBAR_DARK }}
    >
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact, readOnly }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={label}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && (
                <span className="flex flex-1 items-center gap-2 truncate">
                  {label}
                  {readOnly && (
                    <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide bg-white/20 text-white">
                      Read Only
                    </span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {expanded ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-white">{DEMO_SCHOOL.name}</p>
              <p className="mt-0.5 text-[11px] text-white/60">{DEMO_SCHOOL.location}</p>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <User className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{adminName}</p>
                <p className="truncate text-[11px] text-white/60">System Administrator</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggle}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Collapse menu"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Collapse Menu
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition hover:bg-white/15"
            aria-label="Expand menu"
            title="Expand menu"
          >
            <ChevronLeft className="h-4 w-4 rotate-180 text-white" />
          </button>
        )}
      </div>
    </aside>
  )
}
