import type { CalendarPublishStatus } from "@/lib/types"

export type CalendarOperatorRole = "admin" | "kitchen_manager" | "viewer"

export interface CalendarActionPermissions {
  canEditEvent: boolean
  canDeleteEvent: boolean
  canPublish: boolean
  canAssignMeal: boolean
  canDuplicateDay: boolean
  canCopyEvent: boolean
  canSetRecurring: boolean
  canBulkActions: boolean
  canExport: boolean
}

const ADMIN: CalendarActionPermissions = {
  canEditEvent: true,
  canDeleteEvent: true,
  canPublish: true,
  canAssignMeal: true,
  canDuplicateDay: true,
  canCopyEvent: true,
  canSetRecurring: true,
  canBulkActions: true,
  canExport: true,
}

const VIEWER: CalendarActionPermissions = {
  canEditEvent: false,
  canDeleteEvent: false,
  canPublish: false,
  canAssignMeal: false,
  canDuplicateDay: false,
  canCopyEvent: false,
  canSetRecurring: false,
  canBulkActions: false,
  canExport: true,
}

export function getCalendarPermissions(
  role: CalendarOperatorRole = "admin"
): CalendarActionPermissions {
  if (role === "viewer") return VIEWER
  return ADMIN
}

export function publishStatusLabel(status?: CalendarPublishStatus): string {
  switch (status ?? "draft") {
    case "published":
      return "Published"
    case "scheduled":
      return "Scheduled"
    case "archived":
      return "Archived"
    default:
      return "Draft"
  }
}