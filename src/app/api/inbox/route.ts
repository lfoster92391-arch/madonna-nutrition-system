import { NextResponse } from "next/server"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { badRequest, forbidden, withDatabase } from "@/lib/api/response"
import { getSessionUserId } from "@/lib/api/session-auth"

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const userId = getSessionUserId(request) ?? new URL(request.url).searchParams.get("userId")
    if (!userId) {
      return badRequest("Session user id required")
    }

    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({
      where: { id: userId, schoolId, status: "ACTIVE" },
      select: { id: true, role: true },
    })
    if (!user) {
      return forbidden("Valid session required")
    }

    const notifications = await prisma.notification.findMany({
      where: {
        schoolId,
        ...(user.role === "ADMIN" ? {} : { userId: user.id }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        student: { select: { externalId: true, firstName: true, lastName: true } },
      },
    })

    return NextResponse.json({
      notifications: notifications.map((n) => ({
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
      })),
    })
  })
  return result instanceof NextResponse ? result : result
}
