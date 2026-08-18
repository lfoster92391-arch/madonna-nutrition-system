import type { UserRole } from "@/lib/types"

/** School staff who are also parents — parent portal without requiring a linked child first. */
export const DUAL_ROLE_PARENT_EMAILS = new Set([
  "jdalfol@weirtonmadonna.org",
  "jheckathorn@weirtonmadonna.org",
  "sobrien@weirtonmadonna.org",
  "blauttamus@weirtonmadonna.org",
  "ahaught@weirtonmadonna.org",
])

const WORKPLACE_ROLES = new Set(["admin", "staff", "teacher"])

export function normalizeAppRole(role: string): string {
  return role.trim().toLowerCase()
}

export function canAccessParentPortal(user: {
  role: string
  email?: string | null
  linkedStudentIds?: string[] | null
}): boolean {
  const role = normalizeAppRole(user.role)
  if (role === "parent") return true
  if ((user.linkedStudentIds ?? []).length > 0) return true
  const email = user.email?.trim().toLowerCase()
  return Boolean(email && DUAL_ROLE_PARENT_EMAILS.has(email))
}

export function canSwitchParentAndWorkplace(user: {
  role: string
  email?: string | null
  linkedStudentIds?: string[] | null
}): boolean {
  return WORKPLACE_ROLES.has(normalizeAppRole(user.role)) && canAccessParentPortal(user)
}

export function workplaceHomePath(role: string): string {
  switch (normalizeAppRole(role)) {
    case "admin":
      return "/admin"
    case "teacher":
      return "/teacher"
    case "staff":
      return "/staff"
    default:
      return "/parent"
  }
}

export function workplaceSwitchLabel(role: string): string {
  switch (normalizeAppRole(role)) {
    case "admin":
      return "Admin"
    case "teacher":
      return "Teacher"
    case "staff":
      return "Staff"
    default:
      return "School"
  }
}

/** DB roles that may use parent link / billing APIs when they also have parent access. */
export const PARENT_PORTAL_DB_ROLES = ["PARENT", "STAFF", "ADMIN", "TEACHER"] as const

export function isParentCapableDbRole(role: string): boolean {
  const normalized = role.trim().toUpperCase()
  return PARENT_PORTAL_DB_ROLES.includes(normalized as (typeof PARENT_PORTAL_DB_ROLES)[number])
}

export function portalMatchesAccount(
  portalRole: UserRole,
  user: { role: UserRole; email?: string | null; linkedStudentIds?: string[] | null }
): boolean {
  if (portalRole === user.role) return true
  if (portalRole === "parent" && canAccessParentPortal(user)) return true
  return false
}
