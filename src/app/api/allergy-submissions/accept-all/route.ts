import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/api/admin-auth"
import { applyFoodSafetyPayloadToStudent } from "@/lib/allergy/apply-submission"
import { createAuditLog } from "@/lib/db/audit"
import { mapAllergySubmission } from "@/lib/db/mappers"
import { prisma } from "@/lib/prisma"
import { serverError, withDatabase } from "@/lib/api/response"
import type { FoodSafetyFormPayload } from "@/lib/types"

/** Approve every pending dietary form and apply each payload to the student account. */
export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const adminUserId =
        request.headers.get("x-admin-user-id") ?? request.headers.get("x-session-user-id")
      const auth = await requireAdmin(adminUserId, request)
      if ("error" in auth) return auth.error

      const pending = await prisma.allergySubmission.findMany({
        where: {
          student: { schoolId: auth.schoolId },
          status: { in: ["PENDING_REVIEW", "CLARIFICATION_REQUESTED"] },
        },
        include: { student: { select: { id: true, externalId: true } } },
        orderBy: { createdAt: "asc" },
      })

      const now = new Date()
      const reviewedBy =
        `${auth.admin.firstName} ${auth.admin.lastName}`.trim() ||
        auth.admin.email ||
        "Admin"
      const approvedIds: string[] = []

      for (const submission of pending) {
        const payload = submission.changePayload as unknown as FoodSafetyFormPayload
        await prisma.$transaction(async (tx) => {
          await applyFoodSafetyPayloadToStudent(tx, submission.studentId, payload, now)
          await tx.allergySubmission.update({
            where: { id: submission.id },
            data: {
              status: "APPROVED",
              reviewedBy,
              reviewedAt: now,
              reviewNote: "Bulk accept all pending dietary forms",
            },
          })
        })

        await createAuditLog({
          action: "ALLERGY_PROFILE_APPROVED",
          entity: "student_profile",
          entityType: "student_profile",
          entityId: submission.student.externalId,
          performedBy: reviewedBy,
          metadata: {
            reviewedBy,
            submissionId: submission.id,
            source: "bulk_accept",
          },
        })

        approvedIds.push(submission.id)
      }

      const updated = await prisma.allergySubmission.findMany({
        where: { id: { in: approvedIds } },
        include: { student: { select: { externalId: true } } },
      })

      return NextResponse.json({
        count: updated.length,
        submissions: updated.map((s) => mapAllergySubmission(s, s.student.externalId)),
      })
    } catch (error) {
      console.error("POST /api/allergy-submissions/accept-all", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
