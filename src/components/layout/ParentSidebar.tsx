"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "Calendar", href: "/parent/calendar", icon: CalendarDays },
  { label: "Reserve Lunch", href: "/parent/reserve-lunch", icon: UtensilsCrossed },
  { label: "Fund Account", href: "/parent/add-funds", icon: Wallet },
  { label: "Nutrition", href: "/parent/nutrition", icon: ShieldAlert },
  { label: "Notifications", href: "/parent/notifications", icon: Bell },
  { label: "Agreement Status", href: "/parent/agreement", icon: ClipboardCheck },
  { label: "My Students", href: "/parent/students", icon: Users },
  { label: "Student Profiles", href: "/parent/student-profile", icon: ShieldAlert },
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Transactions", href: "/parent/transactions", icon: CreditCard },
  { label: "Low Balance Alerts", href: "/parent/alerts", icon: AlertTriangle },
  { label: "Settings", href: "/parent/settings", icon: Settings },
  { label: "Payment Methods", href: "/parent/payment-methods", icon: CreditCard },
  { label: "Help & Support", href: "/parent/help", icon: HelpCircle },
]

export function ParentSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-silver bg-primary text-white transition-[width] duration-200",
        expanded ? "w-60" : "w-[72px]"
      )}
    >
      <SidebarBrand href="/parent" portalLabel="Parent Portal" compact collapsed={!expanded} />

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
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
          onClick={() => setExpanded((e) => !e)}
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
