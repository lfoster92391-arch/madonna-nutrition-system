import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import { badRequest } from "@/lib/api/response"
import { withStaffAccess } from "@/lib/staff/api"
import { todayDateOnly, toDbPaymentMethod, fromDbPaymentMethod } from "@/lib/teacher/db"
import { TEACHER_LUNCH_DEFAULTS } from "@/lib/teacher/defaults"
import { canonicalMainMealPricing } from "@/lib/lunch-pricing"

const reservationSchema = z.object({
  staffId: z.string().min(1),
  mealName: z.string().min(1).optional(),
  mealPrice: z.number().nonnegative().optional(),
  sliceCount: z.number().int().positive().max(10).optional(),
  paymentMethod: z.enum(["account", "prepay_online", "pay_at_kiosk"]),
  action: z.enum(["reserve", "cancel", "change"]).default("reserve"),
})

function mapReservation(reservation: {
  id: string
  mealName: string
  mealPrice: { toString(): string }
  sliceCount: number | null
  unitPrice: { toString(): string } | null
  totalAmount: { toString(): string } | null
  mealPhotoUrl: string | null
  paymentMethod: Parameters<typeof fromDbPaymentMethod>[0]
  status: string
  pickupLocation: string
  pickupStart: string
  pickupEnd: string
}) {
  return {
    id: reservation.id,
    mealName: reservation.mealName,
    mealPrice: Number(reservation.mealPrice),
    sliceCount: reservation.sliceCount,
    unitPrice: reservation.unitPrice != null ? Number(reservation.unitPrice) : null,
    totalAmount:
      reservation.totalAmount != null
        ? Number(reservation.totalAmount)
        : Number(reservation.mealPrice),
    mealPhotoUrl: reservation.mealPhotoUrl,
    paymentMethod: fromDbPaymentMethod(reservation.paymentMethod),
    status: reservation.status.toLowerCase(),
    pickupLocation: reservation.pickupLocation,
    pickupStart: reservation.pickupStart,
    pickupEnd: reservation.pickupEnd,
    cutoffTime: TEACHER_LUNCH_DEFAULTS.cutoffTime,
  }
}

export async function GET(request: Request) {
  const staffId = new URL(request.url).searchParams.get("staffId")
  return withStaffAccess(staffId, async (staff) => {
    const today = todayDateOnly()
    const reservation = await prisma.teacherLunchReservation.findUnique({
      where: { userId_date: { userId: staff.id, date: today } },
    })

    if (!reservation) {
      return NextResponse.json({ reservation: null })
    }

    return NextResponse.json({ reservation: mapReservation(reservation) })
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = reservationSchema.safeParse(body)
  if (!parsed.success) return badRequest("Invalid reservation payload", parsed.error.flatten())

  const { staffId, paymentMethod, action, mealName, sliceCount } = parsed.data

  return withStaffAccess(staffId, async (staff) => {
    const schoolId = await resolveSchoolId()
    const today = todayDateOnly()

    if (action === "cancel") {
      await prisma.teacherLunchReservation.updateMany({
        where: { userId: staff.id, date: today },
        data: { status: "CANCELLED" },
      })
      return NextResponse.json({ success: true, status: "cancelled" })
    }

    const menuEvent = await prisma.calendarEvent.findFirst({
      where: {
        schoolId,
        date: today,
        category: "menu_day",
      },
      orderBy: { createdAt: "desc" },
    })

    const resolvedMealName =
      mealName ?? menuEvent?.title ?? TEACHER_LUNCH_DEFAULTS.mealName
    const pricing = canonicalMainMealPricing({
      menuTitle: resolvedMealName,
      sliceCount,
    })

    const reservation = await prisma.teacherLunchReservation.upsert({
      where: { userId_date: { userId: staff.id, date: today } },
      update: {
        paymentMethod: toDbPaymentMethod(paymentMethod),
        status: "RESERVED",
        mealName: resolvedMealName,
        mealPrice: pricing.totalAmount,
        sliceCount: pricing.sliceCount,
        unitPrice: pricing.unitPrice,
        totalAmount: pricing.totalAmount,
      },
      create: {
        userId: staff.id,
        schoolId,
        date: today,
        mealName: resolvedMealName,
        mealPrice: pricing.totalAmount,
        sliceCount: pricing.sliceCount,
        unitPrice: pricing.unitPrice,
        totalAmount: pricing.totalAmount,
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
      isPizzaDay: pricing.isPizzaDay,
      reservation: {
        id: reservation.id,
        mealName: reservation.mealName,
        mealPrice: Number(reservation.mealPrice),
        sliceCount: reservation.sliceCount,
        unitPrice: reservation.unitPrice != null ? Number(reservation.unitPrice) : null,
        totalAmount:
          reservation.totalAmount != null
            ? Number(reservation.totalAmount)
            : Number(reservation.mealPrice),
        status: "reserved",
      },
    })
  })
}
