import { NextResponse } from "next/server"
import { withTeacherAccess } from "@/lib/teacher/api"
import { isDatabaseEnabled } from "@/lib/db/config"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")

  if (!isDatabaseEnabled()) {
    return withTeacherAccess(teacherId, async () => {
      return NextResponse.json({ messages: [], unreadCount: 0 })
    })
  }

  const result = await withDatabase(async () => {
    return withTeacherAccess(teacherId, async (teacher) => {
      const schoolId = await resolveSchoolId()

      const [announcements, notifications] = await Promise.all([
        prisma.announcement.findMany({
          where: {
            schoolId,
            audience: { in: ["TEACHERS", "ALL"] },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.notification.findMany({
          where: {
            schoolId,
            userId: teacher.id,
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

      const unreadCount = notificationMessages.filter((m) => !m.read).length

      return NextResponse.json({ messages, unreadCount })
    })
  })
  return result instanceof NextResponse ? result : result
}
