"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Headphones,
  LayoutDashboard,
  Megaphone,
  Menu,
  Rocket,
  Settings,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"
import {
  ADMIN_NAVY,
  ADMIN_SIDEBAR_STORAGE_KEY,
  ADMIN_SILVER,
} from "@/components/admin/layout/admin-theme"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Launch", href: "/admin#get-started", icon: Rocket },
  { label: "Menu", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Operations", href: "/admin/receiving", icon: Wrench },
  { label: "Agreements", href: "/admin/agreements", icon: FileSignature },
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
        "relative z-20 flex shrink-0 flex-col border-r bg-white transition-[width] duration-200",
        expanded ? "w-60" : "w-[72px]"
      )}
      style={{ borderColor: ADMIN_SILVER }}
    >
      <div
        className="flex h-[68px] items-center border-b px-3"
        style={{ borderColor: ADMIN_SILVER }}
      >
        <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <Image
            src="/brand-logo.png"
            alt="Fuel The Dons"
            width={expanded ? 160 : 40}
            height={40}
            priority
            className={cn(
              "shrink-0 object-contain",
              expanded ? "h-10 w-auto max-w-[140px]" : "h-9 w-9"
            )}
          />
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
          ) : (
            <Menu className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact, readOnly }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={label}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition",
                active ? "text-white shadow-sm" : "hover:bg-[#0A1E3F]/5"
              )}
              style={
                active
                  ? { backgroundColor: ADMIN_NAVY }
                  : { color: ADMIN_NAVY }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && (
                <span className="flex flex-1 items-center gap-2 truncate">
                  {label}
                  {readOnly && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: active ? "rgba(255,255,255,0.2)" : ADMIN_SILVER,
                        color: active ? "#fff" : ADMIN_NAVY,
                      }}
                    >
                      RO
                    </span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3" style={{ borderColor: ADMIN_SILVER }}>
        {expanded ? (
          <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: "#F7F8FB" }}>
            <p className="text-xs font-semibold" style={{ color: ADMIN_NAVY }}>
              Madonna Nutrition System
            </p>
            <p className="mt-0.5 text-[10px]" style={{ color: ADMIN_SILVER }}>
              {DEMO_SCHOOL.name}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: ADMIN_SILVER }}>
              © 2025 Fuel The Dons
            </p>
          </div>
        ) : (
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: ADMIN_NAVY }}
          >
            M
          </div>
        )}
      </div>
    </aside>
  )
}
