import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { isParentCapableDbRole } from "@/lib/auth/portal-roles"

/** Resolve whether a parent-capable user has at least one linked student (User or ParentStudent). */
export async function parentHasLinkedStudents(userId: string): Promise<boolean> {
  if (!isDatabaseEnabled()) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, linkedStudentIds: true },
  })

  if (!user || !isParentCapableDbRole(user.role)) return false

  if ((user.linkedStudentIds ?? []).length > 0) return true

  if (!user.email) return false

  const parent = await prisma.parent.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { id: true, _count: { select: { students: true } } },
  })

  return (parent?._count.students ?? 0) > 0
}

export async function linkParentUserToStudent(input: {
  parentUserId: string
  studentExternalId: string
  relationship?: string
}): Promise<{ linkedStudentIds: string[]; studentName: string }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const user = await prisma.user.findUnique({
    where: { id: input.parentUserId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      linkedStudentIds: true,
      schoolId: true,
    },
  })

  if (!user || !isParentCapableDbRole(user.role)) {
    throw new Error("Only parent accounts can link students")
  }

  const student = await prisma.student.findFirst({
    where: {
      schoolId: user.schoolId,
      externalId: input.studentExternalId,
      disabled: false,
    },
    select: { id: true, externalId: true, firstName: true, lastName: true },
  })

  if (!student) {
    throw new Error("Student not found")
  }

  const linkedIds = [...new Set([...(user.linkedStudentIds ?? []), student.externalId])]
  const relationship = input.relationship?.trim() || "Guardian"

  await prisma.user.update({
    where: { id: user.id },
    data: { linkedStudentIds: linkedIds },
  })

  const parent = await prisma.parent.upsert({
    where: { email: user.email.toLowerCase() },
    update: {
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone ?? undefined,
    },
    create: {
      email: user.email.toLowerCase(),
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone ?? undefined,
    },
  })

  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: { parentId: parent.id, studentId: student.id },
    },
    update: { relationship },
    create: {
      parentId: parent.id,
      studentId: student.id,
      relationship,
    },
  })

  return {
    linkedStudentIds: linkedIds,
    studentName: `${student.firstName} ${student.lastName}`,
  }
}
