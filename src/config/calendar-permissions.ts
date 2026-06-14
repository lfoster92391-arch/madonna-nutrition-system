export type CalendarRole = "nutrition_admin" | "office_staff" | "principal"

export type CalendarPermission =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "unpublish"
  | "assign_meal"
  | "bulk_schedule"
  | "copy_week"
  | "duplicate_day"
  | "recurring"
  | "export"
  | "import"
  | "approve"

const ROLE_PERMISSIONS: Record<CalendarRole, CalendarPermission[]> = {
  nutrition_admin: [
    "view",
    "create",
    "edit",
    "delete",
    "publish",
    "unpublish",
    "assign_meal",
    "bulk_schedule",
    "copy_week",
    "duplicate_day",
    "recurring",
    "export",
    "import",
  ],
  office_staff: ["view", "create", "edit", "assign_meal", "duplicate_day", "copy_week"],
  principal: ["view", "approve", "export", "publish", "unpublish"],
}

/** Stub: wire to auth session when available */
export const DEFAULT_CALENDAR_ROLE: CalendarRole = "nutrition_admin"

export function hasCalendarPermission(
  role: CalendarRole,
  permission: CalendarPermission
): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function getCalendarPermissions(role: CalendarRole): CalendarPermission[] {
  return ROLE_PERMISSIONS[role]
}
