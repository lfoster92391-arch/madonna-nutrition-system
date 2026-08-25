import { prisma } from "@/lib/prisma"
import { MILK_JUICE_PRICE } from "@/config/onboarding-pricing"
import { findStudentByExternalId } from "@/lib/db/students"
import { isWeekendDateKey, WEEKEND_MENU_DAY_MESSAGE } from "@/lib/calendar"
import { canonicalMainMealPricing } from "@/lib/lunch-pricing"
import { dateKeyUtcNoon, schoolDateKey } from "@/lib/kitchen/school-day"
import { TEACHER_LUNCH_DEFAULTS } from "@/lib/teacher/defaults"
import { notifyParentsOfStudentLunchOrder } from "@/lib/parent/student-order-alerts"

export type WorkplaceMealType = "MAIN" | "SIDE" | "MILK" | "JUICE"

export function mapWorkplaceReservation(row: {
  id: string
  studentId: string
  date: Date
  mealType: string
  price: { toString(): string }
  sliceCount: number | null
  unitPrice: { toString(): string } | null
  totalAmount: { toString(): string } | null
  status: string
  createdAt: Date
  student: { externalId: string; firstName: string; lastName: string }
}) {
  return {
    id: row.id,
    studentId: row.student.externalId,
    studentName: `${row.student.firstName} ${row.student.lastName}`,
    date: row.date.toISOString().slice(0, 10),
    mealType: row.mealType,
    price: Number(row.price),
    sliceCount: row.sliceCount,
    unitPrice: row.unitPrice != null ? Number(row.unitPrice) : null,
    totalAmount: row.totalAmount != null ? Number(row.totalAmount) : Number(row.price),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  }
}

/**
 * Creates/updates a LunchReservation for kitchen head counts + kiosk signup check.
 * Also upserts StudentLunchSignup when the date is today (teacher meal roster).
 * Skips parent agreement / dietary gates — workplace staff are assisting in school.
 */
export async function upsertWorkplaceStudentLunchReservation(input: {
  studentExternalId: string
  date: string
  mealType: WorkplaceMealType
  price: number
  sliceCount?: number
  signedUpByUserId: string
}): Promise<
  | {
      reservation: ReturnType<typeof mapWorkplaceReservation>
      menuTitle: string | null
      isPizzaDay: boolean
    }
  | { error: "not_found" | "disabled" | "weekend" | "no_menu"; message: string }
> {
  const student = await findStudentByExternalId(input.studentExternalId)
  if (!student) {
    return { error: "not_found" as const, message: "Student not found" }
  }
  if (student.disabled) {
    return {
      error: "disabled" as const,
      message:
        "This student account is disabled. Re-enable the student in Student Manager before signing them up for lunch.",
    }
  }

  if (isWeekendDateKey(input.date)) {
    return { error: "weekend" as const, message: WEEKEND_MENU_DAY_MESSAGE }
  }

  const eventDate = dateKeyUtcNoon(input.date)
  const menuEvent = await prisma.calendarEvent.findFirst({
    where: {
      schoolId: student.schoolId,
      date: eventDate,
      category: "menu_day",
      publishStatus: "published",
    },
  })
  if (!menuEvent) {
    return { error: "no_menu" as const, message: "No published menu for the selected date" }
  }

  const pricing =
    input.mealType === "MAIN"
      ? canonicalMainMealPricing({
          menuTitle: menuEvent.title,
          sliceCount: input.sliceCount,
        })
      : input.mealType === "MILK" || input.mealType === "JUICE"
        ? {
            isPizzaDay: false as const,
            sliceCount: null,
            unitPrice: null,
            totalAmount: MILK_JUICE_PRICE,
          }
        : {
            isPizzaDay: false as const,
            sliceCount: null,
            unitPrice: null,
            totalAmount: input.price,
          }

  const reservation = await prisma.lunchReservation.upsert({
    where: {
      studentId_date_mealType: {
        studentId: student.id,
        date: eventDate,
        mealType: input.mealType,
      },
    },
    update: {
      price: pricing.totalAmount,
      sliceCount: pricing.sliceCount,
      unitPrice: pricing.unitPrice,
      totalAmount: pricing.totalAmount,
      status: "RESERVED",
    },
    create: {
      studentId: student.id,
      date: eventDate,
      mealType: input.mealType,
      price: pricing.totalAmount,
      sliceCount: pricing.sliceCount,
      unitPrice: pricing.unitPrice,
      totalAmount: pricing.totalAmount,
      schoolId: student.schoolId,
    },
    include: {
      student: { select: { externalId: true, firstName: true, lastName: true } },
    },
  })

  const todayKey = schoolDateKey()
  if (input.date === todayKey) {
    await prisma.studentLunchSignup.upsert({
      where: { studentId_date: { studentId: student.id, date: eventDate } },
      update: {
        mealName: menuEvent.title || TEACHER_LUNCH_DEFAULTS.mealName,
        mealPrice: pricing.totalAmount,
        signedUpByUserId: input.signedUpByUserId,
      },
      create: {
        studentId: student.id,
        schoolId: student.schoolId,
        date: eventDate,
        mealName: menuEvent.title || TEACHER_LUNCH_DEFAULTS.mealName,
        mealPrice: pricing.totalAmount,
        paymentMethod: "ACCOUNT",
        signedUpByUserId: input.signedUpByUserId,
      },
    })
  }

  void notifyParentsOfStudentLunchOrder({
    schoolId: student.schoolId,
    studentId: student.id,
    studentExternalId: student.externalId,
    studentName: `${student.firstName} ${student.lastName}`,
    date: input.date,
    mealType: input.mealType,
    amount: pricing.totalAmount,
    sliceCount: pricing.sliceCount,
    menuTitle: menuEvent.title,
    orderedBy: "staff",
    currentBalance: Number(student.balance),
  }).catch((error) => {
    console.error("Parent lunch-order alert failed (workplace signup)", error)
  })

  return {
    reservation: mapWorkplaceReservation(reservation),
    menuTitle: menuEvent.title,
    isPizzaDay: pricing.isPizzaDay,
  }
}
