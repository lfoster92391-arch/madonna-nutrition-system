import { NextResponse } from "next/server"
import { mapUser } from "@/lib/db/mappers"
import { userPhotoUploadSchema } from "@/lib/api/validation"
import { badRequest, forbidden, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * Admin may set any workplace user's photo. Teachers/staff may only set their own.
 * User.photo has no student-style moderation queue — saved photos show on staff badges.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN", "TEACHER", "STAFF"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = userPhotoUploadSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid photo payload", parsed.error.flatten())
      }

      if (auth.user.role !== "ADMIN" && auth.user.id !== id) {
        return forbidden("You can only update your own photo")
      }

      const schoolId = await resolveSchoolId()
      const existing = await prisma.user.findFirst({ where: { id, schoolId } })
      if (!existing) return notFound("User not found")

      if (
        auth.user.role !== "ADMIN" &&
        existing.role !== "TEACHER" &&
        existing.role !== "STAFF"
      ) {
        return forbidden("Only staff and teacher accounts can self-update photos")
      }

      const user = await prisma.user.update({
        where: { id },
        data: { photo: parsed.data.photo },
      })

      return NextResponse.json(mapUser(user))
    } catch (error) {
      console.error("POST /api/users/[id]/photo", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
