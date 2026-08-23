import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { mapAllergySubmission } from "@/lib/db/mappers"
import { applyFoodSafetyPayloadToStudent } from "@/lib/allergy/apply-submission"
import { resolveSchoolId } from "@/lib/db/school"
import { reviewSubmissionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import type { FoodSafetyFormPayload } from "@/lib/types"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = reviewSubmissionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid review payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const submission = await prisma.allergySubmission.findFirst({
        where: { id, student: { schoolId } },
        include: { student: true },
      })
      if (!submission) return notFound("Submission not found")

      const { action, reviewedBy, reviewNote } = parsed.data
      const now = new Date()
      const status =
        action === "approve"
          ? "APPROVED"
          : action === "reject"
            ? "REJECTED"
            : "CLARIFICATION_REQUESTED"

      if (action === "approve") {
        const payload = submission.changePayload as unknown as FoodSafetyFormPayload

        await prisma.$transaction(async (tx) => {
          const { allergies } = await applyFoodSafetyPayloadToStudent(
            tx,
            submission.studentId,
            payload,
            now
          )

          await tx.allergySubmission.update({
            where: { id },
            data: { status, reviewedBy, reviewedAt: now, reviewNote },
          })

          return allergies
        })

        await createAuditLog({
          action: "ALLERGY_PROFILE_APPROVED",
          entity: "student_profile",
          entityType: "student_profile",
          entityId: submission.student.externalId,
          performedBy: reviewedBy,
          metadata: {
            reviewedBy,
            submissionId: id,
          },
        })
      } else {
        await prisma.allergySubmission.update({
          where: { id },
          data: { status, reviewedBy, reviewedAt: now, reviewNote },
        })
      }

      const updated = await prisma.allergySubmission.findUniqueOrThrow({
        where: { id },
        include: { student: { select: { externalId: true } } },
      })

      return NextResponse.json(mapAllergySubmission(updated, updated.student.externalId))
    } catch (error) {
      console.error("POST /api/allergy-submissions/[id]/review", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
