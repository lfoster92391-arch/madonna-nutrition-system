import { NextResponse } from "next/server"
import { getLinkedStudentExternalId } from "@/lib/auth/student-access"
import { findStudentByExternalId } from "@/lib/db/students"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { forbidden, notFound, withDatabase } from "@/lib/api/response"
import { getSessionUserId } from "@/lib/api/session-auth"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const userId = getSessionUserId(request)
    if (!userId) return forbidden("Student session required")

    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId, status: "ACTIVE", role: "STUDENT" },
      select: { id: true },
    })
    if (!user) return forbidden("Student session required")

    const externalId = await getLinkedStudentExternalId(userId)
    if (!externalId) return notFound("No student roster link on this account")

    const student = await findStudentByExternalId(externalId)
    if (!student || student.disabled) {
      return notFound("Student not found or disabled")
    }

    return NextResponse.json({
      student: {
        externalId: student.externalId,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        balance: Number(student.balance),
      },
    })
  })
  return result instanceof NextResponse ? result : result
}
