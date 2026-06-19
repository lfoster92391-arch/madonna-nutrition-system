import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { mapUser } from "@/lib/db/mappers"
import { requireAdmin } from "@/lib/api/admin-auth"
import { adminResetPasswordSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { generateTempPassword } from "@/lib/users"

type RouteParams = { params: Promise<{ id: string }> }

function resolvePassword(input: {
  password?: string
  generateTempPassword?: boolean
}): { password: string; method: "custom" | "generated" } {
  if (input.password) {
    return { password: input.password, method: "custom" }
  }
  return { password: generateTempPassword(), method: "generated" }
}

export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = adminResetPasswordSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid password reset request", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const existing = await prisma.user.findFirst({
        where: { id, schoolId: auth.schoolId },
      })
      if (!existing) return notFound("User not found")

      const { password, method } = resolvePassword({
        password: parsed.data.password,
        generateTempPassword: parsed.data.generateTempPassword ?? !parsed.data.password,
      })
      const passwordHash = await bcrypt.hash(password, 10)
      const forcePasswordChange = parsed.data.forcePasswordChange ?? method === "generated"

      await prisma.user.update({
        where: { id },
        data: { passwordHash, mustChangePassword: forcePasswordChange },
      })

      await createAuditLog({
        action: "PASSWORD_RESET",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy: parsed.data.performedBy,
        reason: parsed.data.reason,
        metadata: {
          method,
          forcePasswordChange,
          targetUsername: existing.username,
          targetRole: mapUser(existing).role,
        },
        newValue: { resetSent: true, forcePasswordChange },
      })

      return NextResponse.json({
        success: true,
        ...(method === "generated" ? { tempPassword: password } : {}),
        forcePasswordChange,
      })
    } catch (error) {
      console.error("POST /api/admin/users/[id]/reset-password", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
