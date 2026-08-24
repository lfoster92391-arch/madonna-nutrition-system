import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/db/audit"
import { findStudentByExternalId } from "@/lib/db/students"
import { requireAdmin } from "@/lib/api/admin-auth"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import {
  findStudentPortalUser,
  upsertStudentPortalAccount,
} from "@/lib/auth/student-accounts"
import { generateTempPassword } from "@/lib/users"
import { sendSecurityAlert } from "@/lib/security/alerts"
import { getClientIp, getUserAgent } from "@/lib/security/client-meta"

export const runtime = "nodejs"

type RouteParams = { params: Promise<{ id: string }> }

const bodySchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  password: z.string().min(8).optional(),
  generateTempPassword: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
  reason: z.string().max(500).optional(),
})

function resolvePassword(input: {
  password?: string
  generateTempPassword?: boolean
}): { password: string; method: "custom" | "generated" } {
  if (input.password) {
    return { password: input.password, method: "custom" }
  }
  return { password: generateTempPassword(), method: "generated" }
}

/** Admin: reset (or create + reset) a student portal password by roster MD ID. */
export async function POST(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id: externalId } = await params
      const body = await request.json()
      const parsed = bodySchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid password reset request", parsed.error.flatten())
      }

      const auth = await requireAdmin(parsed.data.adminUserId)
      if ("error" in auth) return auth.error

      const student = await findStudentByExternalId(externalId)
      if (!student) return notFound("Student not found")
      if (student.disabled) {
        return badRequest("Enable the student account before resetting the portal password")
      }

      const school = await prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { slug: true },
      })

      let portalUser = await findStudentPortalUser(prisma, {
        schoolId: auth.schoolId,
        externalId: student.externalId,
        email: student.email,
      })

      if (!portalUser) {
        const provisioned = await upsertStudentPortalAccount(prisma, {
          schoolId: auth.schoolId,
          schoolSlug: school?.slug,
          student: {
            externalId: student.externalId,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            disabled: student.disabled,
          },
          mustChangePassword: true,
        })
        if (provisioned.action === "skipped") {
          return badRequest(
            "Could not create a student portal login — a non-student account already uses this email or MD ID."
          )
        }
        portalUser = await findStudentPortalUser(prisma, {
          schoolId: auth.schoolId,
          externalId: student.externalId,
          email: student.email,
        })
      }

      if (!portalUser) return serverError()

      const { password, method } = resolvePassword({
        password: parsed.data.password,
        generateTempPassword: parsed.data.generateTempPassword ?? !parsed.data.password,
      })
      const passwordHash = await bcrypt.hash(password, 10)
      const forcePasswordChange = parsed.data.forcePasswordChange ?? method === "generated"

      await prisma.user.update({
        where: { id: portalUser.id },
        data: {
          passwordHash,
          mustChangePassword: forcePasswordChange,
          email: student.email?.trim().toLowerCase() || portalUser.email,
          linkedStudentIds: [student.externalId],
        },
      })

      await createAuditLog({
        action: "PASSWORD_RESET",
        entity: "user",
        entityType: "user",
        entityId: portalUser.id,
        performedBy: parsed.data.performedBy,
        reason: parsed.data.reason,
        metadata: {
          method,
          forcePasswordChange,
          targetUsername: portalUser.username,
          targetRole: "student",
          studentExternalId: student.externalId,
          ip: getClientIp(request),
          userAgent: getUserAgent(request),
        },
        newValue: { resetSent: true, forcePasswordChange },
      })

      void sendSecurityAlert({
        kind: "admin_password_reset",
        subject: `Student portal password reset for ${student.externalId}`,
        body: [
          "An administrator reset a student portal password.",
          "",
          `Student: ${student.firstName} ${student.lastName} (${student.externalId})`,
          `Portal login email: ${student.email ?? portalUser.email}`,
          `Performed by: ${parsed.data.performedBy}`,
          `Method: ${method}`,
          `Force password change: ${forcePasswordChange ? "yes" : "no"}`,
          `Reason: ${parsed.data.reason ?? "(none)"}`,
          `IP: ${getClientIp(request)}`,
        ].join("\n"),
        metadata: {
          targetUserId: portalUser.id,
          studentExternalId: student.externalId,
          performedBy: parsed.data.performedBy,
        },
      })

      return NextResponse.json({
        success: true,
        userId: portalUser.id,
        email: student.email ?? portalUser.email,
        username: portalUser.username,
        ...(method === "generated" ? { tempPassword: password } : {}),
        forcePasswordChange,
      })
    } catch (error) {
      console.error("POST /api/admin/students/[id]/reset-portal-password", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
