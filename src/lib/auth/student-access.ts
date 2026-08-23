import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { findStudentByExternalId } from "@/lib/db/students"

export class StudentAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentAccessError"
  }
}

/** Resolve the MD ID (externalId) this student User is allowed to act as. */
export async function getLinkedStudentExternalId(userId: string): Promise<string | null> {
  const schoolId = await resolveSchoolId()
  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId, status: "ACTIVE", role: "STUDENT" },
    select: { linkedStudentIds: true, email: true, username: true },
  })
  if (!user) return null

  const linked = (user.linkedStudentIds ?? []).map((id) => id.trim()).filter(Boolean)
  if (linked.length === 1) return linked[0]!

  const candidates = [user.username, user.email?.split("@")[0]].filter(Boolean) as string[]
  for (const candidate of candidates) {
    const student = await findStudentByExternalId(candidate)
    if (student && !student.disabled) return student.externalId
  }

  if (user.email) {
    const byEmail = await prisma.student.findFirst({
      where: {
        schoolId,
        email: { equals: user.email, mode: "insensitive" },
        disabled: false,
      },
      select: { externalId: true },
    })
    if (byEmail) return byEmail.externalId
  }

  return linked[0] ?? null
}

/** Ensure the session student User may only order for their own MD ID. */
export async function assertStudentIsSelf(userId: string, studentExternalId: string) {
  const linked = await getLinkedStudentExternalId(userId)
  if (!linked) {
    throw new StudentAccessError("Student account is not linked to a roster record")
  }
  if (linked.trim().toLowerCase() !== studentExternalId.trim().toLowerCase()) {
    throw new StudentAccessError("Students can only order lunch for themselves")
  }
  return linked
}
