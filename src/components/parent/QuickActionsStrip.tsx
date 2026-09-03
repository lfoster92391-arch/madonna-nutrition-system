"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import { PARENT_NAV_CATEGORIES } from "@/components/parent/parent-nav-groups"

type QuickActionsStripProps = {
  onAddFunds?: () => void
  onHistory?: () => void
  onMealActivity?: () => void
  onAlerts?: () => void
  onSettings?: () => void
  onStudents?: () => void
}

export function QuickActionsStrip({
  onAddFunds,
  onHistory,
  onMealActivity,
  onAlerts,
  onSettings,
  onStudents,
}: QuickActionsStripProps) {
  const openMealActivity = onMealActivity ?? onHistory

  const handleAction = (action: string) => {
    switch (action) {
      case "add-funds":
        onAddFunds?.()
        break
      case "history":
        onHistory?.()
        break
      case "meal-activity":
        openMealActivity?.()
        break
      case "alerts":
        onAlerts?.()
        break
      case "settings":
        onSettings?.()
        break
      case "students":
        onStudents?.()
        break
      default:
        break
    }
  }

  return (
    <GroupedOptionNav
      categories={PARENT_NAV_CATEGORIES}
      heading="Quick Actions"
      layout="grid"
      onAction={handleAction}
    />
  )
}
