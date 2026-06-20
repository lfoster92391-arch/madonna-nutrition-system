import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { badRequest } from "@/lib/api/response"
import { withTeacherAccess } from "@/lib/teacher/api"
import { todayDateOnly, toDbPaymentMethod, fromDbPaymentMethod } from "@/lib/teacher/db"
import { TEACHER_LUNCH_DEFAULTS } from "@/lib/teacher/defaults"

const reservationSchema = z.object({
  teacherId: z.string().min(1),
  mealName: z.string().min(1).optional(),
  mealPrice: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["account", "prepay_online", "pay_at_kiosk"]),
  action: z.enum(["reserve", "cancel", "change"]).default("reserve"),
})

export async function GET(request: Request) {
  const teacherId = new URL(request.url).searchParams.get("teacherId")
  return withTeacherAccess(teacherId, async (teacher) => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()
    const reservation = await prisma.teacherLunchReservation.findUnique({
      where: { userId_date: { userId: teacher.id, date: today } },
    })

    if (!reservation) {
      return NextResponse.json({ reservation: null })
    }

    return NextResponse.json({
      reservation: {
        id: reservation.id,
        mealName: reservation.mealName,
        mealPrice: Number(reservation.mealPrice),
        mealPhotoUrl: reservation.mealPhotoUrl,
        paymentMethod: fromDbPaymentMethod(reservation.paymentMethod),
        status: reservation.status.toLowerCase(),
        pickupLocation: reservation.pickupLocation,
        pickupStart: reservation.pickupStart,
        pickupEnd: reservation.pickupEnd,
        cutoffTime: TEACHER_LUNCH_DEFAULTS.cutoffTime,
      },
    })
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = reservationSchema.safeParse(body)
  if (!parsed.success) return badRequest("Invalid reservation payload", parsed.error.flatten())

  const { teacherId, paymentMethod, action, mealName, mealPrice } = parsed.data

  return withTeacherAccess(teacherId, async (teacher) => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    if (action === "cancel") {
      await prisma.teacherLunchReservation.updateMany({
        where: { userId: teacher.id, date: today },
        data: { status: "CANCELLED" },
      })
      return NextResponse.json({ success: true, status: "cancelled" })
    }

    const reservation = await prisma.teacherLunchReservation.upsert({
      where: { userId_date: { userId: teacher.id, date: today } },
      update: {
        paymentMethod: toDbPaymentMethod(paymentMethod),
        status: "RESERVED",
        mealName: mealName ?? TEACHER_LUNCH_DEFAULTS.mealName,
        mealPrice: mealPrice ?? TEACHER_LUNCH_DEFAULTS.mealPrice,
      },
      create: {
        userId: teacher.id,
        schoolId,
        date: today,
        mealName: mealName ?? TEACHER_LUNCH_DEFAULTS.mealName,
        mealPrice: mealPrice ?? TEACHER_LUNCH_DEFAULTS.mealPrice,
        mealPhotoUrl: TEACHER_LUNCH_DEFAULTS.mealPhotoUrl,
        paymentMethod: toDbPaymentMethod(paymentMethod),
        status: "RESERVED",
        pickupLocation: TEACHER_LUNCH_DEFAULTS.pickupLocation,
        pickupStart: TEACHER_LUNCH_DEFAULTS.pickupStart,
        pickupEnd: TEACHER_LUNCH_DEFAULTS.pickupEnd,
      },
    })

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        mealName: reservation.mealName,
        mealPrice: Number(reservation.mealPrice),
        status: "reserved",
      },
    })
  })
}
