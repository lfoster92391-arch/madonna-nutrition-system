import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import { withTeacherAccess } from "@/lib/teacher/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get("teacherId")
  const query = searchParams.get("q")?.trim().toLowerCase() ?? ""

  return withTeacherAccess(teacherId, async () => {
    const schoolId = await resolveSchoolId()
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        disabled: false,
        ...(query
          ? {
              OR: [
                { externalId: { contains: query, mode: "insensitive" } },
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: query ? 20 : 50,
    })

    const safe = students.map((s) =>
      mapStudentForTeacher({
        id: s.externalId,
        firstName: s.firstName,
        lastName: s.lastName,
        photo: s.photo ?? "",
        grade: s.grade,
        homeroom: s.homeroom ?? undefined,
        balance: Number(s.balance),
        allergies: [],
        dietaryRestrictions: [],
        parentContacts: [],
      })
    )

    return NextResponse.json({ students: safe })
  })
}
