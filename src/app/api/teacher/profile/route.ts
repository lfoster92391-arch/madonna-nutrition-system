import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withTeacherAccess } from "@/lib/teacher/api"
import { todayDateOnly, fromDbPaymentMethod } from "@/lib/teacher/db"

const DEFAULT_CUTOFF_TIME = "10:30 AM"
const DEFAULT_MEAL_PHOTO_URL =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop"

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")
  return withTeacherAccess(teacherId, async (teacher) => {
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
            mealPhotoUrl: reservation.mealPhotoUrl ?? DEFAULT_MEAL_PHOTO_URL,
            paymentMethod: fromDbPaymentMethod(reservation.paymentMethod),
            status: reservation.status.toLowerCase(),
            pickupLocation: reservation.pickupLocation,
            pickupStart: reservation.pickupStart,
            pickupEnd: reservation.pickupEnd,
            cutoffTime: DEFAULT_CUTOFF_TIME,
          }
        : null,
    })
  })
}
