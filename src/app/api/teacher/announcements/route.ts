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
      return NextResponse.json({ announcements: [] })
    })
  }

  const result = await withDatabase(async () => {
    return withTeacherAccess(teacherId, async () => {
      const schoolId = await resolveSchoolId()
      const rows = await prisma.announcement.findMany({
        where: {
          schoolId,
          audience: { in: ["TEACHERS", "ALL"] },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })

      return NextResponse.json({
        announcements: rows.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body,
          date: row.createdAt.toISOString().slice(0, 10),
        })),
      })
    })
  })
  return result instanceof NextResponse ? result : result
}
