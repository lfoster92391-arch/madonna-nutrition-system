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
import { ADMIN_NAVY, ADMIN_SILVER, ADMIN_WHITE } from "@/components/admin/layout/admin-theme"

const ACTIONS = [
  { label: "Add Meal", href: "/admin/menu", icon: Plus },
  { label: "Publish Calendar", href: "/admin/calendar", icon: Calendar },
  { label: "Receive Inventory", href: "/admin/receiving", icon: PackageCheck },
  { label: "Send Notice", href: "/admin/communication", icon: Send },
  { label: "Export Report", href: "/admin/reporting", icon: FileDown },
  { label: "Open Cashier", href: "/scan", icon: ScanLine },
]

export function AdminQuickActionBar() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 border-t shadow-[0_-4px_24px_rgba(10,30,63,0.08)]"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
    >
      <div className="mx-auto flex max-w-full items-center justify-center gap-2 overflow-x-auto px-4 py-3 md:gap-3 lg:px-8">
        {ACTIONS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: ADMIN_NAVY }}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
