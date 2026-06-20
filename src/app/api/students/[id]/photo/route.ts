import { NextResponse } from "next/server"
import { mapStudent } from "@/lib/db/mappers"
import { findStudentByExternalId, studentInclude } from "@/lib/db/students"
import { studentPhotoUploadSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN"])
      if ("error" in auth) return auth.error

      const { id } = await params
      const body = await request.json()
      const parsed = studentPhotoUploadSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid photo payload", parsed.error.flatten())
      }

      const existing = await findStudentByExternalId(id)
      if (!existing) return notFound("Student not found")

      const student = await prisma.student.update({
        where: { id: existing.id },
        data: { photo: parsed.data.photo },
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
