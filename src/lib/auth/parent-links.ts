import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { isParentCapableDbRole } from "@/lib/auth/portal-roles"

export type LinkedStudentSummary = {
  id: string
  firstName: string
  lastName: string
  grade: string
  homeroom: string | null
  balance: number
}

async function loadParentStudentExternalIds(email: string | null | undefined): Promise<string[]> {
  if (!email) return []
  const parent = await prisma.parent.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      students: { select: { student: { select: { externalId: true } } } },
    },
  })
  return parent?.students.map((row) => row.student.externalId) ?? []
}

/** Resolve whether a parent-capable user has at least one linked student (User or ParentStudent). */
export async function parentHasLinkedStudents(userId: string): Promise<boolean> {
  if (!isDatabaseEnabled()) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true, linkedStudentIds: true },
  })

  if (!user || !isParentCapableDbRole(user.role)) return false

  if ((user.linkedStudentIds ?? []).length > 0) return true

  const parentIds = await loadParentStudentExternalIds(user.email)
  return parentIds.length > 0
}

export async function getParentLinkedStudentSummaries(
  userId: string
): Promise<LinkedStudentSummary[]> {
  if (!isDatabaseEnabled()) return []

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, schoolId: true, email: true, linkedStudentIds: true },
  })

  if (!user || !isParentCapableDbRole(user.role)) return []

  const ids = [
    ...new Set([...(user.linkedStudentIds ?? []), ...(await loadParentStudentExternalIds(user.email))]),
  ]
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
    throw new Error("Only parent, staff, teacher, or admin accounts can link students")
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

  const published = await prisma.agreementVersion.findFirst({
    where: { schoolId: user.schoolId, status: "PUBLISHED" },
    orderBy: { versionNumber: "desc" },
  })
  if (
    published &&
    parent.cafeteriaAgreementVersionId === published.id &&
    parent.cafeteriaAgreementAcceptedAt
  ) {
    const signature = await prisma.agreementSignature.findFirst({
      where: {
        parentId: parent.id,
        agreementVersionId: published.id,
        status: "SIGNED",
      },
      orderBy: { signedAt: "desc" },
    })
    await prisma.lunchAgreement.upsert({
      where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
      update: {
        agreementVersionId: published.id,
        agreementSignatureId: signature?.id ?? null,
        signedAt: parent.cafeteriaAgreementAcceptedAt,
        status: "SIGNED",
        acceptedTerms: true,
      },
      create: {
        parentId: parent.id,
        studentId: student.id,
        schoolId: user.schoolId,
        agreementVersionId: published.id,
        agreementSignatureId: signature?.id ?? null,
        signedAt: parent.cafeteriaAgreementAcceptedAt,
        status: "SIGNED",
        acceptedTerms: true,
      },
    })
  }

  return {
    linkedStudentIds: linkedIds,
    studentName: `${student.firstName} ${student.lastName}`,
  }
}
