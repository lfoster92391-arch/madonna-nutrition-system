import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"

export type StaffLinkedStudent = {
  id: string
  firstName: string
  lastName: string
  grade: string
  homeroom: string | null
  balance: number
}

/** Persist staff↔student links on User.linkedStudentIds (same field parents use). */
export async function linkStaffUserToStudent(input: {
  staffUserId: string
  studentExternalId: string
}): Promise<{ linkedStudentIds: string[]; studentName: string }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const user = await prisma.user.findUnique({
    where: { id: input.staffUserId },
    select: {
      id: true,
      role: true,
      linkedStudentIds: true,
      schoolId: true,
    },
  })

  if (!user || user.role !== "STAFF") {
    throw new Error("Only staff accounts can link students this way")
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

  await prisma.user.update({
    where: { id: user.id },
    data: { linkedStudentIds: linkedIds },
  })

  return {
    linkedStudentIds: linkedIds,
    studentName: `${student.firstName} ${student.lastName}`,
  }
}

export async function getStaffLinkedStudents(
  staffUserId: string
): Promise<StaffLinkedStudent[]> {
  if (!isDatabaseEnabled()) return []

  const user = await prisma.user.findUnique({
    where: { id: staffUserId },
    select: { role: true, schoolId: true, linkedStudentIds: true },
  })

  if (!user || user.role !== "STAFF") return []

  const ids = user.linkedStudentIds ?? []
  if (ids.length === 0) return []

  const students = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId,
      disabled: false,
      externalId: { in: ids },
    },
    select: {
      externalId: true,
      firstName: true,
      lastName: true,
      grade: true,
      homeroom: true,
      balance: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  return students.map((s) => ({
    id: s.externalId,
    firstName: s.firstName,
    lastName: s.lastName,
    grade: s.grade,
    homeroom: s.homeroom,
    balance: Number(s.balance),
  }))
}
