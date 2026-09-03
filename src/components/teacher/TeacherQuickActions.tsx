"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import { TEACHER_NAV_CATEGORIES } from "@/components/teacher/teacher-nav-groups"

/** Compact account shortcuts — same navy grouped pattern as Quick Access. */
export function TeacherQuickActions() {
  const accountCategory = TEACHER_NAV_CATEGORIES.find((c) => c.id === "order-lunch")
  const categories = accountCategory
    ? [
        {
          id: "account-shortcuts",
          label: "Account & calendar",
          items: accountCategory.items,
        },
      ]
    : []

  if (categories.length === 0) return null

  return (
    <GroupedOptionNav
      categories={categories}
      heading="Quick Actions"
      layout="stack"
    />
  )
}
