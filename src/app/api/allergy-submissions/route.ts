import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapAllergySubmission } from "@/lib/db/mappers"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { allergySubmissionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const submissions = await prisma.allergySubmission.findMany({
      where: { student: { schoolId } },
      include: { student: { select: { externalId: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(
      submissions.map((s) => mapAllergySubmission(s, s.student.externalId))
    )
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = allergySubmissionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid allergy submission", parsed.error.flatten())
      }

      const student = await findStudentByExternalId(parsed.data.studentId)
      if (!student) return notFound("Student not found")

      await prisma.allergySubmission.updateMany({
        where: {
          studentId: student.id,
          status: { in: ["PENDING_REVIEW", "CLARIFICATION_REQUESTED"] },
        },
        data: { status: "REJECTED", reviewNote: "Superseded by new submission" },
      })

      const submission = await prisma.allergySubmission.create({
        data: {
          studentId: student.id,
          submittedBy: parsed.data.submittedBy,
          changePayload: parsed.data.payload,
        },
        include: { student: { select: { externalId: true } } },
      })

      return NextResponse.json(
        mapAllergySubmission(submission, submission.student.externalId),
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/allergy-submissions", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
