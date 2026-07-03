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
      return NextResponse.json({ announcements: [] })
    })
  }

  const result = await withDatabase(async () => {
    return withStaffAccess(staffId, async () => {
      const schoolId = await resolveSchoolId()
      const rows = await prisma.announcement.findMany({
        where: {
          schoolId,
          audience: { in: ["STAFF", "ALL"] },
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
