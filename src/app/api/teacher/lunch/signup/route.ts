import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { findStudentByExternalId } from "@/lib/db/students"
import { badRequest, notFound } from "@/lib/api/response"
import { withTeacherAccess } from "@/lib/teacher/api"
import { todayDateOnly, toDbPaymentMethod } from "@/lib/teacher/db"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import { demoTeacherLunchReservation } from "@/data/demo/teacher"

const signupSchema = z.object({
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  paymentMethod: z.enum(["account", "prepay_online", "pay_at_kiosk"]),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return badRequest("Invalid signup payload", parsed.error.flatten())

  const { teacherId, studentId, paymentMethod } = parsed.data

  return withTeacherAccess(teacherId, async (teacher) => {
    const student = await findStudentByExternalId(studentId)
    if (!student) return notFound("Student not found")

    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    const signup = await prisma.studentLunchSignup.upsert({
      where: { studentId_date: { studentId: student.id, date: today } },
      update: {
        paymentMethod: toDbPaymentMethod(paymentMethod),
        signedUpByUserId: teacher.id,
      },
      create: {
        studentId: student.id,
        schoolId,
        date: today,
        mealName: demoTeacherLunchReservation.mealName,
        mealPrice: demoTeacherLunchReservation.mealPrice,
        paymentMethod: toDbPaymentMethod(paymentMethod),
        signedUpByUserId: teacher.id,
      },
    })

    const safeStudent = mapStudentForTeacher({
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

    return NextResponse.json({
      success: true,
      signup: {
        id: signup.id,
        student: safeStudent,
        paymentMethod,
        signedUpAt: signup.signedUpAt.toISOString(),
      },
    })
  })
}
