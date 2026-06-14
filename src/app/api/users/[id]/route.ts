import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { mapUser, toDbUserRole } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { generateTempPassword } from "@/lib/users"
import { updateUserSchema, userActionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import bcrypt from "bcryptjs"

type RouteParams = { params: Promise<{ id: string }> }

async function getUserOr404(id: string) {
  const schoolId = await resolveSchoolId()
  return prisma.user.findFirst({ where: { id, schoolId } })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = updateUserSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid user update", parsed.error.flatten())
      }

      const existing = await getUserOr404(id)
      if (!existing) return notFound("User not found")

      const data = parsed.data
      const updated = await prisma.user.update({
        where: { id },
        data: {
          username: data.username?.toLowerCase(),
          email: data.email?.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role ? toDbUserRole(data.role) : undefined,
          phone: data.phone,
          linkedStudentIds: data.linkedStudentIds,
        },
      })

      await createAuditLog({
        action: "USER_UPDATED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy: data.performedBy,
        reason: data.reason,
        previousValue: {
          firstName: existing.firstName,
          lastName: existing.lastName,
          email: existing.email,
          role: mapUser(existing).role,
          phone: existing.phone,
          linkedStudentIds: existing.linkedStudentIds,
        },
        newValue: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          role: mapUser(updated).role,
          phone: updated.phone,
          linkedStudentIds: updated.linkedStudentIds,
        },
      })

      return NextResponse.json(mapUser(updated))
    } catch (error) {
      console.error("PATCH /api/users/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = userActionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid delete request", parsed.error.flatten())
      }

      const existing = await getUserOr404(id)
      if (!existing) return notFound("User not found")

      await prisma.user.delete({ where: { id } })

      await createAuditLog({
        action: "USER_DELETED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy: parsed.data.performedBy,
        reason: parsed.data.reason,
        previousValue: {
          username: existing.username,
          email: existing.email,
          role: mapUser(existing).role,
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("DELETE /api/users/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const action = body.action as string

      const existing = await getUserOr404(id)
      if (!existing) return notFound("User not found")

      if (action === "disable") {
        const parsed = userActionSchema.safeParse(body)
        if (!parsed.success) return badRequest("Invalid disable request", parsed.error.flatten())
        if (existing.status === "DISABLED") return badRequest("User already disabled")

        await prisma.user.update({ where: { id }, data: { status: "DISABLED" } })
        await createAuditLog({
          action: "USER_DISABLED",
          entity: "user",
          entityType: "user",
          entityId: id,
          performedBy: parsed.data.performedBy,
          reason: parsed.data.reason,
          previousValue: { status: "active" },
          newValue: { status: "disabled" },
        })
        return NextResponse.json({ success: true })
      }

      if (action === "enable") {
        const parsed = userActionSchema.safeParse(body)
        if (!parsed.success) return badRequest("Invalid enable request", parsed.error.flatten())
        if (existing.status === "ACTIVE") return badRequest("User already active")

        await prisma.user.update({ where: { id }, data: { status: "ACTIVE" } })
        await createAuditLog({
          action: "USER_ENABLED",
          entity: "user",
          entityType: "user",
          entityId: id,
          performedBy: parsed.data.performedBy,
          reason: parsed.data.reason,
          previousValue: { status: "disabled" },
          newValue: { status: "active" },
        })
        return NextResponse.json({ success: true })
      }

      if (action === "reset-password") {
        const parsed = userActionSchema.safeParse(body)
        if (!parsed.success) {
          return badRequest("Invalid password reset request", parsed.error.flatten())
        }

        const tempPassword = generateTempPassword()
        const passwordHash = await bcrypt.hash(tempPassword, 10)
        await prisma.user.update({ where: { id }, data: { passwordHash } })
        await createAuditLog({
          action: "PASSWORD_RESET",
          entity: "user",
          entityType: "user",
          entityId: id,
          performedBy: parsed.data.performedBy,
          reason: parsed.data.reason,
          metadata: { method: "temp_password", clerkReady: true, resetSent: true },
          newValue: { resetSent: true },
        })
        return NextResponse.json({ tempPassword })
      }

      return badRequest("Unknown action")
    } catch (error) {
      console.error("POST /api/users/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
