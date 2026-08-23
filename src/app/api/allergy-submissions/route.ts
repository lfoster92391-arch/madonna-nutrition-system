import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapAllergySubmission } from "@/lib/db/mappers"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { applyFoodSafetyPayloadToStudent } from "@/lib/allergy/apply-submission"
import { createAuditLog } from "@/lib/db/audit"
import { allergySubmissionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import type { FoodSafetyFormPayload } from "@/lib/types"

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

      const payload = parsed.data.payload as FoodSafetyFormPayload
      const now = new Date()

      const submission = await prisma.$transaction(async (tx) => {
        await tx.allergySubmission.updateMany({
          where: {
            studentId: student.id,
            status: { in: ["PENDING_REVIEW", "CLARIFICATION_REQUESTED"] },
          },
          data: { status: "REJECTED", reviewNote: "Superseded by new submission" },
        })

        await applyFoodSafetyPayloadToStudent(tx, student.id, payload, now)

        return tx.allergySubmission.create({
          data: {
            studentId: student.id,
            submittedBy: parsed.data.submittedBy,
            changePayload: parsed.data.payload,
            status: "APPROVED",
            reviewedBy: "auto-accept",
            reviewedAt: now,
            reviewNote: "Applied to student account on submit",
          },
          include: { student: { select: { externalId: true } } },
        })
      })

      await createAuditLog({
        action: "ALLERGY_PROFILE_APPROVED",
        entity: "student_profile",
        entityType: "student_profile",
        entityId: student.externalId,
        performedBy: parsed.data.submittedBy,
        metadata: {
          reviewedBy: "auto-accept",
          submissionId: submission.id,
          source: "parent_submit",
        },
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
