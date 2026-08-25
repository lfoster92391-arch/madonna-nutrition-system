import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { findStudentByExternalId } from "@/lib/db/students"
import { requireWorkplaceLunchSignupSession } from "@/lib/auth/workplace-lunch"
import {
  mapWorkplaceReservation,
  upsertWorkplaceStudentLunchReservation,
} from "@/lib/workplace/student-lunch-signup"
import { DEFAULT_ONBOARDING_PRICING } from "@/config/onboarding-pricing"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["MAIN", "SIDE", "MILK", "JUICE"]),
  price: z.number().nonnegative().optional(),
  sliceCount: z.number().int().positive().max(10).optional(),
})

const batchSchema = z.object({
  studentId: z.string().min(1),
  items: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        mealType: z.enum(["MAIN", "SIDE", "MILK", "JUICE"]),
        price: z.number().nonnegative().optional(),
        sliceCount: z.number().int().positive().max(10).optional(),
      })
    )
    .min(1)
    .max(40),
})

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireWorkplaceLunchSignupSession(request)
      if ("error" in auth) return auth.error

      const studentId = new URL(request.url).searchParams.get("studentId")?.trim() ?? ""
      if (!studentId) {
        return badRequest("studentId is required")
      }

      const student = await findStudentByExternalId(studentId)
      if (!student || student.schoolId !== auth.schoolId) {
        return notFound("Student not found")
      }

      const reservations = await prisma.lunchReservation.findMany({
        where: {
          schoolId: auth.schoolId,
          studentId: student.id,
          status: "RESERVED",
        },
        include: {
          student: { select: { externalId: true, firstName: true, lastName: true } },
        },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      })

      return NextResponse.json({
        student: {
          id: student.externalId,
          firstName: student.firstName,
          lastName: student.lastName,
          photo: student.photo ?? "",
          grade: student.grade,
          disabled: student.disabled,
          balance: Number(student.balance),
        },
        reservations: reservations.map(mapWorkplaceReservation),
      })
    } catch (error) {
      console.error("GET /api/workplace/student-lunch-reservations", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireWorkplaceLunchSignupSession(request)
      if ("error" in auth) return auth.error

      const body = await request.json()

      // Batch: multiple days / meal items in one save
      if (Array.isArray(body?.items)) {
        const parsed = batchSchema.safeParse(body)
        if (!parsed.success) {
          return badRequest("Invalid signup payload", parsed.error.flatten())
        }

        const created = []
        for (const item of parsed.data.items) {
          const price =
            item.price ??
            (item.mealType === "SIDE"
              ? DEFAULT_ONBOARDING_PRICING.sideMealPrice
              : DEFAULT_ONBOARDING_PRICING.mainMealPrice)

          const outcome = await upsertWorkplaceStudentLunchReservation({
            studentExternalId: parsed.data.studentId,
            date: item.date,
            mealType: item.mealType,
            price,
            sliceCount: item.sliceCount,
            signedUpByUserId: auth.user.id,
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
          created.push(outcome)
        }

        return NextResponse.json(
          {
            success: true,
            count: created.length,
            reservations: created.map((c) => c.reservation),
            results: created,
          },
          { status: 201 }
        )
      }

      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid signup payload", parsed.error.flatten())
      }

      const price =
        parsed.data.price ??
        (parsed.data.mealType === "SIDE"
          ? DEFAULT_ONBOARDING_PRICING.sideMealPrice
          : DEFAULT_ONBOARDING_PRICING.mainMealPrice)

      const outcome = await upsertWorkplaceStudentLunchReservation({
        studentExternalId: parsed.data.studentId,
        date: parsed.data.date,
        mealType: parsed.data.mealType,
        price,
        sliceCount: parsed.data.sliceCount,
        signedUpByUserId: auth.user.id,
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

      return NextResponse.json(
        {
          success: true,
          reservation: outcome.reservation,
          menuTitle: outcome.menuTitle,
          isPizzaDay: outcome.isPizzaDay,
        },
        { status: 201 }
      )
    } catch (error) {
      console.error("POST /api/workplace/student-lunch-reservations", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
