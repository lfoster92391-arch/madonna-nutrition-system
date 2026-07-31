"use client"

import Link from "next/link"
import {
  Calendar,
  ChefHat,
  PackageCheck,
  ScanLine,
  Send,
  Upload,
} from "lucide-react"
import { ADMIN_NAVY, ADMIN_SILVER } from "@/components/admin/layout/admin-theme"

const ACTIONS = [
  { label: "Open today's menu", href: "/admin/calendar", icon: Calendar },
  { label: "Add a meal", href: "/admin/cookbook", icon: ChefHat },
  { label: "Import students", href: "/admin/imports", icon: Upload },
  { label: "Receive delivery", href: "/admin/receiving", icon: PackageCheck },
  { label: "Send a notice", href: "/admin/communication", icon: Send },
  { label: "Open lunch line", href: "/kiosk", icon: ScanLine },
]

export function AdminQuickActionBar() {
  return (
    <nav
      aria-label="Quick actions"
      className="shrink-0 border-b shadow-sm"
      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: ADMIN_NAVY }}
    >
      <div className="flex items-center gap-3 overflow-x-auto px-3 py-3 sm:px-4 md:gap-3 md:px-6 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
      <div className="h-0.5" style={{ backgroundColor: ADMIN_SILVER, opacity: 0.15 }} />
    </nav>
  )
}
