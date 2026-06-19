import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/api/admin-auth"
import { createAuditLog } from "@/lib/db/audit"
import { mapUser, toDbUserRole } from "@/lib/db/mappers"
import {
  assertBadgeIdAvailable,
  assertCanChangeUserRole,
  getSchoolUserOrNull,
} from "@/lib/db/users"
import { updateUserRoleSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { formatRoleChangeReason, userRoleSupportsBadge } from "@/lib/users"
import type { UserRole } from "@/lib/types"

type RouteParams = { params: Promise<{ id: string }> }

function normalizeBadgeId(role: UserRole, badgeId?: string | null) {
  if (!userRoleSupportsBadge(role)) return null
  const trimmed = badgeId?.trim()
  return trimmed ? trimmed : null
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const result = await withDatabase(async () => {
    try {
      const { id } = await params
      const body = await request.json()
      const parsed = updateUserRoleSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid role update", parsed.error.flatten())
      }

      const { role, adminUserId, performedBy } = parsed.data
      const auth = await requireAdmin(adminUserId)
      if ("error" in auth) return auth.error

      const existing = await getSchoolUserOrNull(id, auth.schoolId)
      if (!existing) return notFound("User not found")

      if (existing.role === role) {
        return NextResponse.json(existing)
      }

      const roleConflict = await assertCanChangeUserRole(
        auth.schoolId,
        existing.role,
        role
      )
      if (roleConflict) return badRequest(roleConflict)

      const badgeId = normalizeBadgeId(role, existing.badgeId)
      if (badgeId) {
        const badgeConflict = await assertBadgeIdAvailable(badgeId, auth.schoolId, id)
        if (badgeConflict) return badRequest(badgeConflict)
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          role: toDbUserRole(role),
          badgeId,
          linkedStudentIds: role === "parent" ? existing.linkedStudentIds : [],
        },
      })

      const mapped = mapUser(updated)
      const reason = formatRoleChangeReason(existing.role, role)

      await createAuditLog({
        action: "ROLE_CHANGED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy: performedBy ?? adminUserId,
        reason,
        previousValue: { role: existing.role },
        newValue: { role },
      })

      return NextResponse.json(mapped)
    } catch (error) {
      console.error("PATCH /api/admin/users/[id]", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
