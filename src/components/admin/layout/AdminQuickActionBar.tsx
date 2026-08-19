"use client"

import Link from "next/link"
import {
  BookOpen,
  Calendar,
  ChefHat,
  DollarSign,
  FileDown,
  PackageCheck,
  ScanLine,
  Send,
  Upload,
  Users,
} from "lucide-react"
import { ADMIN_NAVY, ADMIN_SILVER } from "@/components/admin/layout/admin-theme"

const ACTIONS = [
  { label: "Open today's menu", href: "/admin/calendar", icon: Calendar },
  { label: "Add a meal", href: "/admin/cookbook", icon: ChefHat },
  { label: "Import students", href: "/admin/imports", icon: Upload },
  { label: "Receive Inventory", href: "/admin/receiving", icon: PackageCheck },
  { label: "Send Notice", href: "/admin/communication", icon: Send },
  { label: "Export Report", href: "/admin/reporting", icon: FileDown },
  { label: "Kitchen board", href: "/admin/kitchen", icon: ChefHat },
  { label: "Open lunch line", href: "/kiosk", icon: ScanLine },
  { label: "Add or take money off", href: "/admin/imports", icon: DollarSign },
  { label: "Staff", href: "/admin/imports?tab=staff", icon: Users },
  { label: "Worker Guide", href: "/admin/setup", icon: BookOpen },
]

export function AdminQuickActionBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="shrink-0 border-b shadow-sm"
      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: ADMIN_NAVY }}
    >
      <div className="mobile-scroll-x flex items-center gap-2 px-2 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-6 lg:px-8">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
      <div className="h-0.5" style={{ backgroundColor: ADMIN_SILVER, opacity: 0.15 }} />
    </nav>
  )
}
