import { isDatabaseEnabled } from "@/lib/db/config"
import { findStudentByExternalId, findStudentByScanId } from "@/lib/db/students"
import { prisma } from "@/lib/prisma"

export class ParentAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ParentAccessError"
  }
}

export interface ParentStudentAccess {
  schoolId: string
  studentName: string
  billingStudentId: string
  payerRole: "PARENT" | "STAFF" | "OTHER"
}

export async function assertParentOwnsStudent(
  parentUserId: string,
  studentId: string
): Promise<ParentStudentAccess> {
  if (!isDatabaseEnabled()) {
    throw new ParentAccessError("Student billing requires a configured database.")
  }

  const student = (await findStudentByExternalId(studentId)) ?? (await findStudentByScanId(studentId))
  if (!student) {
    throw new ParentAccessError("Student not found")
  }

  const user = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: { linkedStudentIds: true, email: true, role: true },
  })

  const linkedIds = user?.linkedStudentIds ?? []
  const canLinkViaUser =
    user?.role === "PARENT" ||
    user?.role === "STAFF" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER"
  const ownsViaUser =
    Boolean(canLinkViaUser) &&
    (linkedIds.includes(student.id) || linkedIds.includes(student.externalId))

  if (ownsViaUser) {
    return {
      schoolId: student.schoolId,
      studentName: `${student.firstName} ${student.lastName}`,
      billingStudentId: student.id,
      payerRole: user!.role === "PARENT" ? "PARENT" : "STAFF",
    }
  }

  // ParentStudent join for any parent-capable account (staff/admin dual-role included).
  if (canLinkViaUser && user?.email) {
    const parent = await prisma.parent.findUnique({
      where: { email: user.email },
      select: {
        students: {
          where: { studentId: student.id },
          select: { studentId: true },
        },
      },
    })

    if (parent?.students.length) {
      return {
        schoolId: student.schoolId,
        studentName: `${student.firstName} ${student.lastName}`,
        billingStudentId: student.id,
        payerRole: "PARENT",
      }
    }
  }

  throw new ParentAccessError("You can only add funds for your linked students")
}
