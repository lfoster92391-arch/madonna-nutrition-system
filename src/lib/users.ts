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

export function findUserByLogin(
  users: User[],
  username: string
): User | undefined {
  const normalized = username.trim().toLowerCase()
  const aliases: Record<string, string> = {
    parent: "sarah.anderson",
    admin: "d.garcia",
    cashier: "j.wilson",
    teacher: "m.anderson",
  }
  const lookup = aliases[normalized] ?? normalized
  return users.find(
    (u) =>
      u.username.toLowerCase() === lookup ||
      u.email.toLowerCase() === lookup
  )
}
