import { NextResponse } from "next/server"
import { badgeStatusToDb, mapStudent } from "@/lib/db/mappers"
import { assertBarcodeAvailable, findStudentByExternalId, studentInclude } from "@/lib/db/students"
import { badgeAssignSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ mdId: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const { mdId } = await params
      const body = await request.json()
      const parsed = badgeAssignSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid badge assignment", parsed.error.flatten())
      }

      const existing = await findStudentByExternalId(mdId)
      if (!existing) return notFound("Student not found")

      const data = parsed.data
      const barcode = data.barcode === null ? null : data.barcode?.trim() || undefined

      if (barcode !== undefined) {
        const conflict = await assertBarcodeAvailable(
          barcode,
          auth.schoolId,
          existing.id
        )
        if (conflict) return badRequest(conflict)
      }

      const student = await prisma.student.update({
        where: { id: existing.id },
        data: {
          ...(barcode !== undefined ? { barcode } : {}),
          ...(data.badgeStatus
            ? { badgeStatus: badgeStatusToDb(data.badgeStatus) }
            : {}),
          ...(data.photo !== undefined ? { photo: data.photo } : {}),
        },
        include: studentInclude,
      })

      return NextResponse.json(mapStudent(student))
    } catch (error) {
      console.error("PATCH /api/badges/[mdId]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
