import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { withTeacherAccess } from "@/lib/teacher/api"
import { todayDateOnly, fromDbPaymentMethod } from "@/lib/teacher/db"
import { demoTeacherLunchReservation } from "@/data/demo/teacher"

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")
  return withTeacherAccess(teacherId, async (teacher) => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    const reservation = await prisma.teacherLunchReservation.findUnique({
      where: { userId_date: { userId: teacher.id, date: today } },
    })

    return NextResponse.json({
      profile: {
        id: teacher.id,
        displayName: teacher.displayName,
        email: teacher.email,
        department: teacher.department,
        accountBalance: teacher.accountBalance,
      },
      reservation: reservation
        ? {
            id: reservation.id,
            mealName: reservation.mealName,
            mealPrice: Number(reservation.mealPrice),
            mealPhotoUrl: reservation.mealPhotoUrl ?? demoTeacherLunchReservation.mealPhotoUrl,
            paymentMethod: fromDbPaymentMethod(reservation.paymentMethod),
            status: reservation.status.toLowerCase(),
            pickupLocation: reservation.pickupLocation,
            pickupStart: reservation.pickupStart,
            pickupEnd: reservation.pickupEnd,
            cutoffTime: demoTeacherLunchReservation.cutoffTime,
          }
        : null,
    })
  })
}
