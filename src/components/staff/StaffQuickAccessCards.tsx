"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import { STAFF_NAV_CATEGORIES } from "@/components/staff/staff-nav-groups"

export function StaffQuickAccessCards() {
  return (
    <GroupedOptionNav
      categories={STAFF_NAV_CATEGORIES}
      heading="Quick Access"
      layout="grid"
    />
  )
}
