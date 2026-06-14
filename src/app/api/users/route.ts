import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { mapUser, toDbUserRole } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { createUserSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const users = await prisma.user.findMany({
      where: { schoolId },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
    return NextResponse.json(users.map(mapUser))
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = createUserSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid user payload", parsed.error.flatten())
      }

      const schoolId = await resolveSchoolId()
      const data = parsed.data

      const user = await prisma.user.create({
        data: {
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          role: toDbUserRole(data.role),
          phone: data.phone,
          linkedStudentIds: data.linkedStudentIds ?? [],
          schoolId,
        },
      })

      await createAuditLog({
        action: "USER_CREATED",
        entity: "user",
        entityType: "user",
        entityId: user.id,
        performedBy: data.performedBy,
        newValue: {
          username: user.username,
          email: user.email,
          role: data.role,
          status: "active",
        },
      })

      return NextResponse.json(mapUser(user), { status: 201 })
    } catch (error) {
      console.error("POST /api/users", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
