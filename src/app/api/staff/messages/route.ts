import { NextResponse } from "next/server"
import { withStaffAccess } from "@/lib/staff/api"
import { isDatabaseEnabled } from "@/lib/db/config"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId")

  if (!isDatabaseEnabled()) {
    return withStaffAccess(staffId, async () => {
      return NextResponse.json({ messages: [] })
    })
  }

  const result = await withDatabase(async () => {
    return withStaffAccess(staffId, async (staff) => {
      const schoolId = await resolveSchoolId()

      const [announcements, notifications] = await Promise.all([
        prisma.announcement.findMany({
          where: {
            schoolId,
            audience: { in: ["STAFF", "ALL"] },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.notification.findMany({
          where: {
            schoolId,
            userId: staff.id,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])

      const announcementMessages = announcements.map((row) => ({
        id: `ann-${row.id}`,
        source: "announcement" as const,
        title: row.title,
        body: row.body,
        read: true,
        createdAt: row.createdAt.toISOString(),
      }))

      const notificationMessages = notifications.map((row) => ({
        id: `notif-${row.id}`,
        source: "notification" as const,
        title: row.title ?? row.type.replace(/_/g, " "),
        body: row.message,
        read: row.read,
        createdAt: row.createdAt.toISOString(),
      }))

      const messages = [...announcementMessages, ...notificationMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      return NextResponse.json({ messages })
    })
  })
  return result instanceof NextResponse ? result : result
}
