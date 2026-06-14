import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"

export { userRoleSupportsBadge } from "@/lib/users"

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
