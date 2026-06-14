import { NextResponse } from "next/server"
import { findStudentByExternalId } from "@/lib/db/students"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import { withTeacherAccess } from "@/lib/teacher/api"
import { notFound } from "@/lib/api/response"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const teacherId = new URL(request.url).searchParams.get("teacherId")

  return withTeacherAccess(teacherId, async () => {
    const student = await findStudentByExternalId(id)
    if (!student) return notFound("Student not found")

    const safe = mapStudentForTeacher({
      id: student.externalId,
      firstName: student.firstName,
      lastName: student.lastName,
      photo: student.photo ?? "",
      grade: student.grade,
      homeroom: student.homeroom ?? undefined,
      balance: Number(student.balance),
      allergies: [],
      dietaryRestrictions: [],
      parentContacts: [],
    })

    return NextResponse.json({ student: safe })
  })
}
