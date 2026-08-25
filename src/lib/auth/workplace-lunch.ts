import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { forbidden } from "@/lib/api/response"
import { getSessionUserId } from "@/lib/api/session-auth"

/** Roles that may search any student and place lunch reservations for them. */
export const WORKPLACE_LUNCH_SIGNUP_ROLES = [
  "ADMIN",
  "TEACHER",
  "STAFF",
  "CASHIER",
] as const

export type WorkplaceLunchSignupRole = (typeof WORKPLACE_LUNCH_SIGNUP_ROLES)[number]

export async function requireWorkplaceLunchSignupSession(request: Request) {
  const userId = getSessionUserId(request)
  if (!userId) {
    return { error: forbidden("Session required to sign up a student for lunch") } as const
  }

  const schoolId = await resolveSchoolId()
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      schoolId,
      status: "ACTIVE",
      role: { in: [...WORKPLACE_LUNCH_SIGNUP_ROLES] },
    },
    select: { id: true, role: true, firstName: true, lastName: true },
  })

  if (!user) {
    return {
      error: forbidden(
        "Teacher, staff, admin, or cashier session required to sign up students for lunch"
      ),
    } as const
  }

  return { schoolId, user } as const
}
