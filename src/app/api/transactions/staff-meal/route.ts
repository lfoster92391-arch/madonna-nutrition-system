import { NextResponse } from "next/server"
import { debitStaffMeal } from "@/lib/db/deposits"
import { mapUser } from "@/lib/db/mappers"
import { staffMealTransactionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireCashierOrApiKey } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireCashierOrApiKey(request)
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = staffMealTransactionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid staff meal transaction", parsed.error.flatten())
      }

      const { userId, meal, amount, processedByUserId } = parsed.data

      if (processedByUserId) {
        const cashier = await prisma.user.findFirst({
          where: { id: processedByUserId, schoolId: auth.schoolId, status: "ACTIVE" },
        })
        if (!cashier || cashier.role === "PARENT") {
          return badRequest("Invalid cashier for this transaction")
        }
      }

      try {
        const credit = await debitStaffMeal({
          userId,
          schoolId: auth.schoolId,
          amountDollars: amount,
          mealLabel: meal,
          processedByUserId,
        })
        const user = await prisma.user.findFirst({
          where: { id: userId, schoolId: auth.schoolId },
        })
        return NextResponse.json(
          {
            balanceAfter: credit.balanceAfter,
            user: user ? mapUser(user) : undefined,
            meal,
            amount,
          },
          { status: 201 }
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : "Staff meal failed"
        if (message.includes("not found") || message.includes("disabled")) {
          return notFound(message)
        }
        return badRequest(message)
      }
    } catch (error) {
      console.error("POST /api/transactions/staff-meal", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
