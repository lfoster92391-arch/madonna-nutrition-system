"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import type { PortalNavCategory } from "@/components/nav/nav-types"

const HUB_CATEGORIES: PortalNavCategory[] = [
  {
    id: "account",
    label: "Account & balances",
    items: [
      { label: "Add Funds", href: "/parent/payments?tab=funding" },
      { label: "Transfer Balance", href: "/parent/students" },
    ],
  },
  {
    id: "profile",
    label: "Children / profile",
    items: [
      { label: "Manage Allergies", href: "/parent/student-profile" },
      { label: "View Meals", href: "/parent/student-profile" },
      { label: "Nutrition Forms", href: "/parent/nutrition" },
    ],
  },
]

export function StudentHubQuickActions() {
  return (
    <GroupedOptionNav
      categories={HUB_CATEGORIES}
      heading="Quick Actions"
      layout="grid"
    />
  )
}
