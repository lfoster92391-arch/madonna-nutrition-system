import { NextResponse } from "next/server"
import { withStaffAccess } from "@/lib/staff/api"
import { isDatabaseEnabled } from "@/lib/db/config"
import { mapTransaction } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { withDatabase } from "@/lib/api/response"

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId")

  if (!isDatabaseEnabled()) {
    return withStaffAccess(staffId, async () => {
      return NextResponse.json({ transactions: [] })
    })
  }

  const result = await withDatabase(async () => {
    return withStaffAccess(staffId, async (staff) => {
      if (staff.linkedStudentIds.length === 0) {
        return NextResponse.json({ transactions: [] })
      }

      const schoolId = await resolveSchoolId()
      const rows = await prisma.transaction.findMany({
        where: {
          schoolId,
          student: { externalId: { in: staff.linkedStudentIds } },
        },
        include: {
          student: { select: { externalId: true, firstName: true, lastName: true } },
          processedBy: { select: { firstName: true, lastName: true, badgeId: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      return NextResponse.json({
        transactions: rows.map(mapTransaction),
      })
    })
  })
  return result instanceof NextResponse ? result : result
}
