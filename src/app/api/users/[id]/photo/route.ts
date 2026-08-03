import { NextResponse } from "next/server"
import { mapUser } from "@/lib/db/mappers"
import { userPhotoUploadSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = userPhotoUploadSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid photo payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const existing = await prisma.user.findFirst({ where: { id, schoolId } })
      if (!existing) return notFound("User not found")

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
