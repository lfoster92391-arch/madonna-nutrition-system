import { NextResponse } from "next/server"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { badRequest, forbidden, withDatabase } from "@/lib/api/response"
import { getSessionUserId } from "@/lib/api/session-auth"
import { filterNotificationsForParent } from "@/lib/parent/inbox-scope"

/** Resolve children linked via User.linkedStudentIds and ParentStudent (by email). */
async function resolveLinkedStudentIds(input: {
  schoolId: string
  email: string
  linkedStudentIds: string[]
}): Promise<{ dbIds: Set<string>; externalIds: Set<string> }> {
  const externalIds = new Set(
    input.linkedStudentIds.map((id) => id.trim()).filter(Boolean)
  )

  const byExternal =
    externalIds.size === 0
      ? []
      : await prisma.student.findMany({
          where: {
            schoolId: input.schoolId,
            externalId: { in: [...externalIds] },
          },
          select: { id: true, externalId: true },
        })

  const parentRow = await prisma.parent.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
    select: {
      students: {
        select: {
          student: { select: { id: true, externalId: true, schoolId: true } },
        },
      },
    },
  })

  const dbIds = new Set<string>()
  for (const row of byExternal) {
    dbIds.add(row.id)
    externalIds.add(row.externalId)
  }

  for (const link of parentRow?.students ?? []) {
    if (link.student.schoolId !== input.schoolId) continue
    dbIds.add(link.student.id)
    externalIds.add(link.student.externalId)
  }

  return { dbIds, externalIds }
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    // Header only — do not accept ?userId= (IDOR). Parent A must not fetch parent B.
    const userId = getSessionUserId(request)
    if (!userId) {
      return badRequest("Session user id required")
    }

    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId, status: "ACTIVE" },
      select: {
        id: true,
        role: true,
        email: true,
        linkedStudentIds: true,
      },
    })
    if (!user) {
      return forbidden("Valid session required")
    }

    const { dbIds: linkedDbIds, externalIds: linkedExternalIds } =
      await resolveLinkedStudentIds({
        schoolId,
        email: user.email,
        linkedStudentIds: user.linkedStudentIds ?? [],
      })

    // Always scope by session user. Never return school-wide rows for ADMIN
    // (admin parent-preview must not leak other families' PII).
    const rows = await prisma.notification.findMany({
      where: {
        schoolId,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      include: {
        student: { select: { id: true, externalId: true, firstName: true, lastName: true } },
      },
    })

    const scoped = filterNotificationsForParent({
      sessionUserId: user.id,
      linkedStudentDbIds: linkedDbIds,
      linkedStudentExternalIds: linkedExternalIds,
      notifications: rows.map((n) => ({
        id: n.id,
        userId: n.userId,
        studentId: n.studentId,
        studentExternalId: n.student?.externalId ?? null,
      })),
    })
    const allowedIds = new Set(scoped.map((n) => n.id))

    const notifications = rows
      .filter((n) => allowedIds.has(n.id))
      .slice(0, 50)
      .map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title ?? n.type.replace(/_/g, " "),
        message: n.message,
        read: n.read,
        emailSent: n.emailSent,
        studentId: n.student?.externalId ?? null,
        studentName: n.student
          ? `${n.student.firstName} ${n.student.lastName}`
          : null,
        createdAt: n.createdAt.toISOString(),
      }))

    return NextResponse.json({ notifications })
  })
  return result instanceof NextResponse ? result : result
}
