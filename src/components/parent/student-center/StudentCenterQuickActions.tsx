"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import type { PortalNavCategory } from "@/components/nav/nav-types"

const CENTER_CATEGORIES: PortalNavCategory[] = [
  {
    id: "profile",
    label: "Children / profile",
    items: [
      { label: "Manage Allergies", href: "/parent/student-profile" },
      { label: "View Nutrition Forms", href: "/parent/agreement" },
    ],
  },
  {
    id: "account",
    label: "Account & balances",
    items: [
      { label: "Meal History", href: "/parent/meal-history" },
      { label: "Transfer Balance", href: "/parent/add-funds" },
    ],
  },
]

export function StudentCenterQuickActions() {
  return (
    <GroupedOptionNav
      categories={CENTER_CATEGORIES}
      heading="Quick Actions"
      layout="grid"
    />
  )
}
