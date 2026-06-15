"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"

const SIDEBAR_STORAGE_KEY = "parent-sidebar-expanded"

const navLinks = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "Student Profiles", href: "/parent/student-profile", icon: ShieldAlert },
  { label: "Payments", href: "/parent/payments", icon: CreditCard },
  { label: "Settings", href: "/parent/settings", icon: Settings },
  { label: "Support", href: "/parent/help", icon: HelpCircle },
]

export function ParentSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setExpanded(stored === "true")
    }
  }, [])

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-silver bg-primary text-white transition-[width] duration-200",
        expanded ? "w-60" : "w-[72px]"
      )}
    >
      <SidebarBrand href="/parent" portalLabel="Parent Portal" compact collapsed={!expanded} />

      <nav className="flex-1 space-y-1 overflow-hidden p-2">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/parent" && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-[14px] text-sm font-medium transition",
                expanded ? "px-3" : "justify-center px-0",
                active
                  ? "bg-success text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
          title={!expanded ? "Logout" : undefined}
          className={cn(
            "flex min-h-11 w-full items-center gap-3 rounded-[14px] text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white",
            expanded ? "px-3" : "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </nav>

      <div className="space-y-2 border-t border-silver p-2">
        <button
          type="button"
          onClick={toggleExpanded}
          className={cn(
            "flex min-h-9 w-full items-center gap-2 rounded-[14px] text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white",
            expanded ? "px-3" : "justify-center"
          )}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="px-3 pb-2 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-white">{DEMO_SCHOOL.name}</p>
            <p className="text-[10px] uppercase text-silver">{DEMO_SCHOOL.location}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
