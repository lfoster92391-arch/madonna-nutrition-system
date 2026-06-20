import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { mapUser, toDbUserRole } from "@/lib/db/mappers"
import { assertBadgeIdAvailable, userRoleSupportsBadge } from "@/lib/db/users"
import { requireAdmin } from "@/lib/api/admin-auth"
import { adminCreateUserSchema } from "@/lib/api/validation"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { generateTempPassword } from "@/lib/users"
import type { UserRole } from "@/lib/types"

function normalizeBadgeId(role: UserRole, badgeId?: string | null) {
  if (!userRoleSupportsBadge(role)) return null
  const trimmed = badgeId?.trim()
  return trimmed ? trimmed : null
}

function resolvePassword(input: {
  password?: string
  generateTempPassword?: boolean
}): { password: string; method: "custom" | "generated" } {
  if (input.password) {
    return { password: input.password, method: "custom" }
  }
  return { password: generateTempPassword(), method: "generated" }
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const adminUserId = request.headers.get("x-admin-user-id")
    const auth = await requireAdmin(adminUserId)
    if ("error" in auth) return auth.error

    const users = await prisma.user.findMany({
      where: { schoolId: auth.schoolId },
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
      const parsed = adminCreateUserSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid user payload", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const data = parsed.data
      const badgeId = normalizeBadgeId(data.role, data.badgeId)
      const badgeConflict = await assertBadgeIdAvailable(badgeId, auth.schoolId)
      if (badgeConflict) return badRequest(badgeConflict)

      const { password, method } = resolvePassword({
        password: data.password,
        generateTempPassword: data.generateTempPassword ?? !data.password,
      })
      const passwordHash = await bcrypt.hash(password, 10)
      const forcePasswordChange = data.forcePasswordChange ?? method === "generated"

      const user = await prisma.user.create({
        data: {
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          role: toDbUserRole(data.role),
          phone: data.phone,
          badgeId,
          linkedStudentIds: data.linkedStudentIds ?? [],
          passwordHash,
          mustChangePassword: forcePasswordChange,
          schoolId: auth.schoolId,
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
          badgeId,
          passwordSet: true,
          forcePasswordChange,
        },
      })

      return NextResponse.json(
        {
          user: mapUser(user),
          ...(method === "generated" ? { tempPassword: password } : {}),
        },
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/admin/users", error)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const targets = (error.meta?.target as string[] | undefined) ?? []
        if (targets.includes("email")) {
          return badRequest("A user with this email already exists.")
        }
        if (targets.includes("username")) {
          return badRequest("A user with this username already exists.")
        }
        return badRequest("A user with this username or email already exists.")
      }
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
