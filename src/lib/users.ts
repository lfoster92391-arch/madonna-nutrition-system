import type { User, UserRole } from "@/lib/types"

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  cashier: "Cashier",
  parent: "Parent",
  staff: "Staff",
  teacher: "Teacher",
}

const STAFF_BADGE_ROLES = new Set<UserRole>(["admin", "cashier", "staff", "teacher"])

export function userRoleSupportsBadge(role: UserRole): boolean {
  return STAFF_BADGE_ROLES.has(role)
}

export function formatRoleChangeReason(fromRole: UserRole, toRole: UserRole): string {
  return `Role changed from ${ROLE_LABELS[fromRole]} to ${ROLE_LABELS[toRole]} by admin`
}

export const LAST_ADMIN_ERROR =
  "Cannot demote the last active administrator for this school."

export function countActiveAdmins(users: User[]): number {
  return users.filter((u) => u.role === "admin" && u.status === "active").length
}

export function assertCanChangeUserRole(
  users: User[],
  currentRole: UserRole,
  nextRole: UserRole
): string | null {
  if (currentRole === nextRole) return null
  if (currentRole === "admin" && nextRole !== "admin" && countActiveAdmins(users) <= 1) {
    return LAST_ADMIN_ERROR
  }
  return null
}

export function formatUserName(user: Pick<User, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`
}

export function generateTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/** Lowercase login id; strips whitespace so "IT Lisa" matches stored `itlisa`. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "")
}

export function findUserByLogin(
  users: User[],
  username: string
): User | undefined {
  const normalized = normalizeUsername(username)
  const aliases: Record<string, string> = {
    parent: "sarah.anderson",
    admin: "d.garcia",
    cashier: "j.wilson",
    teacher: "m.anderson",
  }
  const lookup = aliases[normalized] ?? normalized
  return users.find(
    (u) =>
      normalizeUsername(u.username) === lookup ||
      u.email.toLowerCase() === lookup
  )
}
