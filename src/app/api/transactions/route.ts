import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapTransaction } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const transactions = await prisma.transaction.findMany({
      where: { schoolId },
      include: {
        student: { select: { externalId: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })
    return NextResponse.json(transactions.map(mapTransaction))
  })
  return result instanceof NextResponse ? result : result
}
