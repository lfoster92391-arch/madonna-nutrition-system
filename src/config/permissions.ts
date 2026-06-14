export type AppRole =
  | "parent"
  | "teacher"
  | "admin"
  | "cashier"
  | "nutrition_admin"
  | "principal"

export const ROLE_LABELS: Record<AppRole, string> = {
  parent: "Parent",
  teacher: "Teacher",
  admin: "Admin",
  cashier: "Cashier",
  nutrition_admin: "Nutrition Admin",
  principal: "Principal",
}

export type Permission =
  | "view_dashboard"
  | "manage_menu"
  | "manage_calendar"
  | "manage_inventory"
  | "manage_operations"
  | "view_intelligence"
  | "manage_users"
  | "view_audit_log"
  | "review_allergies"
  | "operate_kiosk"
  | "parent_portal"
  | "teacher_portal"

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  parent: ["parent_portal"],
  teacher: ["teacher_portal", "view_dashboard"],
  admin: [
    "view_dashboard",
    "manage_menu",
    "manage_calendar",
    "manage_inventory",
    "manage_operations",
    "view_intelligence",
    "manage_users",
    "view_audit_log",
    "review_allergies",
    "operate_kiosk",
  ],
  cashier: ["operate_kiosk"],
  nutrition_admin: [
    "view_dashboard",
    "manage_menu",
    "manage_calendar",
    "manage_inventory",
    "manage_operations",
    "view_intelligence",
    "review_allergies",
  ],
  principal: ["view_dashboard", "view_intelligence", "view_audit_log"],
}

export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
