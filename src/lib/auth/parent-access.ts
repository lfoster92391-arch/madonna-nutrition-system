import { isDatabaseEnabled } from "@/lib/db/config"
import { findStudentByExternalId } from "@/lib/db/students"
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
}

export async function assertParentOwnsStudent(
  parentUserId: string,
  studentId: string
): Promise<ParentStudentAccess> {
  if (!isDatabaseEnabled()) {
    throw new ParentAccessError("Student billing requires a configured database.")
  }

  const student = await findStudentByExternalId(studentId)
  if (!student) {
    throw new ParentAccessError("Student not found")
  }

  const user = await prisma.user.findUnique({
    where: { id: parentUserId },
    select: { linkedStudentIds: true, email: true, role: true },
  })

  const linkedIds = user?.linkedStudentIds ?? []
  const ownsViaUser =
    user?.role === "PARENT" &&
    (linkedIds.includes(student.id) || linkedIds.includes(student.externalId))

  if (ownsViaUser) {
    return {
      schoolId: student.schoolId,
      studentName: `${student.firstName} ${student.lastName}`,
      billingStudentId: student.id,
    }
  }

  if (user?.email) {
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
      }
    }
  }

  throw new ParentAccessError("You can only add funds for your linked students")
}
