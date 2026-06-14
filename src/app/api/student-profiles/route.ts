import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapStudentProfile } from "@/lib/db/mappers"
import { resolveSchoolId } from "@/lib/db/school"
import { withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const profiles = await prisma.studentProfile.findMany({
      where: { student: { schoolId } },
      include: { student: { select: { externalId: true } } },
    })
    return NextResponse.json(
      profiles.map((p) => mapStudentProfile(p, p.student.externalId))
    )
  })
  return result instanceof NextResponse ? result : result
}
