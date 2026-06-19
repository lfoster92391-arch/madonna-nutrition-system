"use client"

import Link from "next/link"
import {
  Calendar,
  FileDown,
  PackageCheck,
  Plus,
  ScanLine,
  Send,
} from "lucide-react"
import { ADMIN_NAVY, ADMIN_SILVER } from "@/components/admin/layout/admin-theme"

const ACTIONS = [
  { label: "Add Meal", href: "/admin/menu", icon: Plus, prefix: "+" },
  { label: "Publish Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Receive Inventory", href: "/admin/receiving", icon: PackageCheck },
  { label: "Send Notice", href: "/admin/communication", icon: Send },
  { label: "Export Report", href: "/admin/reporting", icon: FileDown },
  { label: "Open Cashier", href: "/scan", icon: ScanLine },
]

export function AdminQuickActionBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t shadow-[0_-4px_24px_rgba(0,0,0,0.2)]"
      style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: ADMIN_NAVY }}
    >
      <div className="mx-auto flex max-w-full items-center justify-center gap-2 overflow-x-auto px-4 py-3 md:gap-3 lg:px-8">
        {ACTIONS.map(({ label, href, icon: Icon, prefix }) => (
          <Link
            key={label}
            href={href}
            className="flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">
              {prefix ? `${prefix} ${label}` : label}
            </span>
          </Link>
        ))}
      </div>
      <div className="h-0.5" style={{ backgroundColor: ADMIN_SILVER, opacity: 0.15 }} />
    </div>
  )
}
