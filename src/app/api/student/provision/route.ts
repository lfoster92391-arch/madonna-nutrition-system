import { NextResponse } from "next/server"
import { z } from "zod"
import { upsertStudentPortalAccount } from "@/lib/auth/student-accounts"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"

const bodySchema = z.object({
  studentExternalId: z.string().min(1),
  mustChangePassword: z.boolean().optional(),
})

/** Admin: create or refresh a STUDENT portal login for a roster student (MD ID). */
export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const parsed = bodySchema.safeParse(await request.json())
      if (!parsed.success) {
        return badRequest("Invalid provision payload", parsed.error.flatten())
      }

      const student = await findStudentByExternalId(parsed.data.studentExternalId)
      if (!student) return notFound("Student not found")
      if (student.disabled) {
        return badRequest("Enable the student account before creating a portal login")
      }

      const school = await prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { slug: true },
      })

      const resultRow = await upsertStudentPortalAccount(prisma, {
        schoolId: auth.schoolId,
        schoolSlug: school?.slug,
        student: {
          externalId: student.externalId,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          disabled: student.disabled,
        },
        mustChangePassword: parsed.data.mustChangePassword ?? true,
      })

      return NextResponse.json({
        success: true,
        action: resultRow.action,
        username: resultRow.username,
        email: resultRow.email,
        message:
          resultRow.action === "skipped"
            ? "Skipped — a non-student account already uses this username or email"
            : "Student portal login ready. Sign in at /login/student with school email (MD ID optional).",
      })
    } catch (error) {
      console.error("POST /api/student/provision", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function GET() {
  const schoolId = await resolveSchoolId()
  return NextResponse.json({
    schoolId,
    hint: "POST with admin session and { studentExternalId } to create a student portal login.",
  })
}
