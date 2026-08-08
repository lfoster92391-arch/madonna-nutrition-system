import { NextResponse } from "next/server"
import { z } from "zod"
import { assertParentOwnsStudent, ParentAccessError } from "@/lib/auth/parent-access"
import { getStudentAgreementStatusById } from "@/lib/agreements/service"
import { isLunchSignupAllowed } from "@/lib/agreements/student-status"
import { findStudentByExternalId } from "@/lib/db/students"
import { resolveSchoolId } from "@/lib/db/school"
import { prisma } from "@/lib/prisma"
import { badRequest, forbidden, notFound, serverError, withDatabase } from "@/lib/api/response"
import { getSessionUserId } from "@/lib/api/session-auth"
import { isWeekendDateKey, WEEKEND_MENU_DAY_MESSAGE } from "@/lib/calendar"
import { resolveMainMealPricing } from "@/lib/pizza-day"

const createReservationSchema = z.object({
  parentUserId: z.string().min(1),
  studentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["MAIN", "SIDE", "ALA_CARTE", "MILK"]),
  price: z.number().nonnegative(),
  sliceCount: z.number().int().positive().max(10).optional(),
})

function mapReservation(row: {
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

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const parentUserId =
      new URL(request.url).searchParams.get("parentUserId") ?? getSessionUserId(request)
    if (!parentUserId) {
      return badRequest("parentUserId is required")
    }

    const schoolId = await resolveSchoolId()
    const user = await prisma.user.findFirst({
      where: { id: parentUserId, schoolId, role: "PARENT", status: "ACTIVE" },
      select: { linkedStudentIds: true, email: true },
    })
    if (!user) {
      return forbidden("Parent session required")
    }

    const linkedIds = user.linkedStudentIds ?? []
    const parentLinks = user.email
      ? await prisma.parentStudent.findMany({
          where: { parent: { email: user.email.toLowerCase() } },
          select: { studentId: true },
        })
      : []

    const studentDbIds = new Set([
      ...linkedIds,
      ...parentLinks.map((l) => l.studentId),
    ])

    const students = await prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { id: { in: [...studentDbIds] } },
          { externalId: { in: [...studentDbIds] } },
        ],
      },
      select: { id: true },
    })

    const reservations = await prisma.lunchReservation.findMany({
      where: {
        schoolId,
        studentId: { in: students.map((s) => s.id) },
      },
      include: {
        student: { select: { externalId: true, firstName: true, lastName: true } },
      },
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ reservations: reservations.map(mapReservation) })
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const body = await request.json()
      const parsed = createReservationSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid reservation payload", parsed.error.flatten())
      }

      const { parentUserId, studentId, date, mealType, price, sliceCount } = parsed.data

      try {
        await assertParentOwnsStudent(parentUserId, studentId)
      } catch (error) {
        if (error instanceof ParentAccessError) {
          return forbidden(error.message)
        }
        throw error
      }

      const agreement = await getStudentAgreementStatusById(studentId)
      if (!agreement || !isLunchSignupAllowed(agreement.status)) {
        return forbidden("Signed cafeteria agreement required before reserving lunch")
      }

      const student = await findStudentByExternalId(studentId)
      if (!student || student.disabled) {
        return notFound("Student not found or disabled")
      }

      const profile = await prisma.studentProfile.findUnique({
        where: { studentId: student.id },
      })
      const pendingSubmission = await prisma.allergySubmission.findFirst({
        where: {
          studentId: student.id,
          status: { in: ["PENDING_REVIEW", "CLARIFICATION_REQUESTED"] },
        },
      })

      const hasDietary =
        profile?.allergyVerified &&
        (!profile.allergyExpiresAt || profile.allergyExpiresAt > new Date())
      if (!hasDietary || pendingSubmission) {
        return forbidden("Current dietary and allergy form required before reserving lunch")
      }

      const eventDate = new Date(`${date}T12:00:00.000Z`)
      if (isWeekendDateKey(date)) {
        return badRequest(WEEKEND_MENU_DAY_MESSAGE)
      }

      const menuEvent = await prisma.calendarEvent.findFirst({
        where: {
          schoolId: student.schoolId,
          date: eventDate,
          category: "menu_day",
        },
      })
      if (!menuEvent) {
        return badRequest("No published menu for the selected date")
      }

      const pricing =
        mealType === "MAIN"
          ? resolveMainMealPricing({
              menuTitle: menuEvent.title,
              sliceCount,
              fallbackPrice: price,
            })
          : {
              isPizzaDay: false as const,
              sliceCount: null,
              unitPrice: null,
              totalAmount: price,
            }

      const reservation = await prisma.lunchReservation.upsert({
        where: {
          studentId_date_mealType: {
            studentId: student.id,
            date: eventDate,
            mealType,
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
          mealType,
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

      return NextResponse.json(
        {
          reservation: mapReservation(reservation),
          menuTitle: menuEvent.title,
          isPizzaDay: pricing.isPizzaDay,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/lunch-reservations", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
