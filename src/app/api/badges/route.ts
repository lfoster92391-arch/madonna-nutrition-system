import { NextResponse } from "next/server"
import { DEMO_STUDENT_EXTERNAL_IDS } from "@/config/demo-students"
import { mapStudent } from "@/lib/db/mappers"
import { studentInclude } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { serverError, withDatabase } from "@/lib/api/response"

export async function GET() {
  const result = await withDatabase(async () => {
    const schoolId = await resolveSchoolId()
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        disabled: false,
        externalId: { notIn: [...DEMO_STUDENT_EXTERNAL_IDS] },
      },
      include: studentInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    })
    return NextResponse.json(students.map(mapStudent))
  })
  return result instanceof NextResponse ? result : result
}
