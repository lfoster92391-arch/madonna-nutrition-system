import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, notFound } from "@/lib/api/response"
import { withTeacherAccess } from "@/lib/teacher/api"
import { findStudentByExternalId } from "@/lib/db/students"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import { schoolDateKey } from "@/lib/kitchen/school-day"
import { DEFAULT_ONBOARDING_PRICING } from "@/config/onboarding-pricing"
import { upsertWorkplaceStudentLunchReservation } from "@/lib/workplace/student-lunch-signup"

const signupSchema = z.object({
  teacherId: z.string().min(1),
  studentId: z.string().min(1),
  paymentMethod: z.enum(["account", "prepay_online", "pay_at_kiosk"]),
})

/**
 * Quick “today” student lunch signup from teacher lookup.
 * Creates LunchReservation (kitchen + kiosk) and StudentLunchSignup (meal roster).
 */
export async function POST(request: Request) {
  const body = await request.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) return badRequest("Invalid signup payload", parsed.error.flatten())

  const { teacherId, studentId } = parsed.data

  return withTeacherAccess(teacherId, async (teacher) => {
    const student = await findStudentByExternalId(studentId)
    if (!student) return notFound("Student not found")
    if (student.disabled) {
      return NextResponse.json(
        {
          error:
            "This student account is disabled. Re-enable the student in Student Manager before signing them up for lunch.",
        },
        { status: 403 }
      )
    }

    const today = schoolDateKey()
    const outcome = await upsertWorkplaceStudentLunchReservation({
      studentExternalId: student.externalId,
      date: today,
      mealType: "MAIN",
      price: DEFAULT_ONBOARDING_PRICING.mainMealPrice,
      signedUpByUserId: teacher.id,
    })

    if ("error" in outcome) {
      if (outcome.error === "disabled") {
        return NextResponse.json({ error: outcome.message }, { status: 403 })
      }
      if (outcome.error === "not_found") {
        return notFound(outcome.message)
      }
      return badRequest(outcome.message)
    }

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
        id: outcome.reservation.id,
        student: safeStudent,
        paymentMethod: parsed.data.paymentMethod,
        signedUpAt: new Date().toISOString(),
        reservation: outcome.reservation,
        menuTitle: outcome.menuTitle,
      },
    })
  })
}
