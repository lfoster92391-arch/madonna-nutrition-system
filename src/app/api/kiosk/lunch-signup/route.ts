import { NextResponse } from "next/server"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { resolveSchoolId } from "@/lib/db/school"
import { findStudentByExternalId, findStudentByScanId } from "@/lib/db/students"
import { dateKeyUtcNoon, schoolDateKey } from "@/lib/kitchen/school-day"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * Kiosk checkout: does this student have a lunch signup for today?
 * Counts RESERVED LunchReservation rows (any meal type) and teacher StudentLunchSignup.
 */
export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const q = new URL(request.url).searchParams.get("studentId")?.trim() ?? ""
      if (!q) {
        return badRequest("studentId is required")
      }

      const schoolId = await resolveSchoolId()
      const student =
        (await findStudentByExternalId(q)) ?? (await findStudentByScanId(q))
      if (!student || student.schoolId !== schoolId) {
        return notFound("Student not found")
      }

      const dateKey = schoolDateKey()
      const day = dateKeyUtcNoon(dateKey)

      const [reservation, teacherSignup] = await Promise.all([
        prisma.lunchReservation.findFirst({
          where: {
            schoolId,
            studentId: student.id,
            date: day,
            status: "RESERVED",
          },
          select: { mealType: true },
        }),
        prisma.studentLunchSignup.findFirst({
          where: {
            schoolId,
            studentId: student.id,
            date: day,
          },
          select: { id: true },
        }),
      ])

      const signedUp = Boolean(reservation || teacherSignup)

      return NextResponse.json({
        verified: true,
        signedUp,
        date: dateKey,
        studentId: student.externalId,
        mealType: reservation?.mealType ?? null,
        source: reservation ? "reservation" : teacherSignup ? "teacher_signup" : null,
      })
    } catch (error) {
      console.error("GET /api/kiosk/lunch-signup", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
