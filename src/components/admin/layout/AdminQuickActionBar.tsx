"use client"

import { GroupedNavDropdownBar } from "@/components/nav/GroupedNavDropdownBar"
import { ADMIN_NAV_CATEGORIES } from "@/components/admin/layout/admin-nav-groups"
import type { PortalNavCategory } from "@/components/nav/nav-types"

const TOPBAR_CATEGORIES: PortalNavCategory[] = ADMIN_NAV_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  shortLabel: shortAdminLabel(c.id, c.label),
  items: c.items.map((item) => ({ label: item.label, href: item.href })),
}))

function shortAdminLabel(id: string, label: string) {
  const map: Record<string, string> = {
    students: "Students",
    menu: "Menu",
    kitchen: "Kitchen",
    operations: "Operations",
    financials: "Financials",
    people: "People",
    communications: "Comms",
    insights: "Insights",
    settings: "Settings",
  }
  return map[id] ?? label
}

export function AdminQuickActionBar() {
  return (
    <GroupedNavDropdownBar
      aria-label="Admin quick navigation"
      categories={TOPBAR_CATEGORIES}
      directLinks={[{ label: "Cashier / POS", href: "/kiosk", icon: "scan" }]}
    />
  )
}
