import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { findStudentByScanId } from "@/lib/db/students"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import { withTeacherAccess } from "@/lib/teacher/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get("teacherId")
  const query = searchParams.get("q")?.trim() ?? ""

  return withTeacherAccess(teacherId, async () => {
    const schoolId = await resolveSchoolId()
    const q = query.toLowerCase()
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        disabled: false,
        ...(q
          ? {
              OR: [
                { externalId: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: query ? 20 : 50,
    })

    const scanned = query ? await findStudentByScanId(query) : null
    const merged =
      scanned && !scanned.disabled
        ? [scanned, ...students.filter((s) => s.id !== scanned.id)]
        : students

    const safe = merged.slice(0, 20).map((s) =>
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
