import { NextResponse } from "next/server"
import { mapStudent, photoStatusToDb } from "@/lib/db/mappers"
import { findStudentByExternalId, findStudentByScanId, studentInclude } from "@/lib/db/students"
import { studentPhotoModerationSchema, studentPhotoUploadSchema } from "@/lib/api/validation"
import {
  badRequest,
  forbidden,
  notFound,
  serverError,
  withDatabase,
} from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { assertParentOwnsStudent, ParentAccessError } from "@/lib/auth/parent-access"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN", "PARENT"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = studentPhotoUploadSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid photo payload", parsed.error.flatten())
      }

      if (auth.user.role === "PARENT") {
        try {
          await assertParentOwnsStudent(auth.user.id, id)
        } catch (error) {
          if (error instanceof ParentAccessError) {
            return forbidden("You can only update photos for your linked students")
          }
          throw error
        }
      }

      const existing = (await findStudentByExternalId(id)) ?? (await findStudentByScanId(id))
      if (!existing) return notFound("Student not found")

      // Parents submit for review; admin uploads are badge-ready immediately.
      const photoStatus =
        auth.user.role === "PARENT" ? photoStatusToDb("pending") : photoStatusToDb("approved")

      const student = await prisma.student.update({
        where: { id: existing.id },
        data: { photo: parsed.data.photo, photoStatus },
        include: studentInclude,
      })

      return NextResponse.json(mapStudent(student))
    } catch (error) {
      console.error("POST /api/students/[id]/photo", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

/** Admin approve / deny a pending lunch-badge photo. */
export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = studentPhotoModerationSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid moderation payload", parsed.error.flatten())
      }

      const existing = (await findStudentByExternalId(id)) ?? (await findStudentByScanId(id))
      if (!existing) return notFound("Student not found")

      const photoStatus =
        parsed.data.action === "approve"
          ? photoStatusToDb("approved")
          : photoStatusToDb("denied")

      const student = await prisma.student.update({
        where: { id: existing.id },
        data: {
          photoStatus,
          // Denied photos must not remain on badges — clear until a new upload.
          ...(parsed.data.action === "deny" ? { photo: null } : {}),
        },
        include: studentInclude,
      })

      return NextResponse.json(mapStudent(student))
    } catch (error) {
      console.error("PATCH /api/students/[id]/photo", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
