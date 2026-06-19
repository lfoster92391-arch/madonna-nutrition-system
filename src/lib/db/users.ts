import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { mapUser } from "@/lib/db/mappers"
import type { UserRole } from "@/lib/types"

export { userRoleSupportsBadge } from "@/lib/users"

export const LAST_ADMIN_ERROR =
  "Cannot demote the last active administrator for this school."

export async function countActiveAdmins(schoolId: string): Promise<number> {
  return prisma.user.count({
    where: { schoolId, role: "ADMIN", status: "ACTIVE" },
  })
}

export async function assertCanChangeUserRole(
  schoolId: string,
  currentRole: UserRole,
  nextRole: UserRole
): Promise<string | null> {
  if (currentRole === nextRole) return null
  if (currentRole === "admin" && nextRole !== "admin") {
    const adminCount = await countActiveAdmins(schoolId)
    if (adminCount <= 1) return LAST_ADMIN_ERROR
  }
  return null
}

export async function getSchoolUserOrNull(userId: string, schoolId: string) {
  const user = await prisma.user.findFirst({ where: { id: userId, schoolId } })
  return user ? mapUser(user) : null
}

export async function findUserByBadgeId(badgeId: string) {
  const schoolId = await resolveSchoolId()
  return prisma.user.findFirst({
    where: { schoolId, badgeId },
  })
}

export async function assertBadgeIdAvailable(
  badgeId: string | null | undefined,
  schoolId: string,
  excludeUserId?: string
) {
  if (!badgeId) return null

  const existing = await prisma.user.findFirst({
    where: {
      schoolId,
      badgeId,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  })

  if (existing) {
    return `Badge ID ${badgeId} is already assigned to ${existing.firstName} ${existing.lastName}.`
  }

  return null
}
