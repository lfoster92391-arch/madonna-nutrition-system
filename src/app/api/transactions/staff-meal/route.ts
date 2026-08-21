import { NextResponse } from "next/server"
import { debitStaffMeal } from "@/lib/db/deposits"
import { mapUser } from "@/lib/db/mappers"
import { staffMealTransactionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireCashierOrApiKey } from "@/lib/api/session-auth"
import { deductInventoryForSale } from "@/lib/operations/sale-deduction"
import { canonicalMainMealPricing, isMainLunchKioskMeal } from "@/lib/lunch-pricing"
import { prisma } from "@/lib/prisma"
import { todayDateOnly } from "@/lib/teacher/db"

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

      const { userId, meal, amount, processedByUserId, mealType } = parsed.data

      if (processedByUserId) {
        const cashier = await prisma.user.findFirst({
          where: { id: processedByUserId, schoolId: auth.schoolId, status: "ACTIVE" },
        })
        if (!cashier || cashier.role === "PARENT") {
          return badRequest("Invalid cashier for this transaction")
        }
      }

      let chargedAmount = amount
      if (isMainLunchKioskMeal(meal, mealType)) {
        const todayMenu = await prisma.calendarEvent.findFirst({
          where: { schoolId: auth.schoolId, date: todayDateOnly(), category: "menu_day" },
          orderBy: { createdAt: "desc" },
          select: { title: true },
        })
        chargedAmount = canonicalMainMealPricing({ menuTitle: todayMenu?.title }).totalAmount
      }

      try {
        const credit = await debitStaffMeal({
          userId,
          schoolId: auth.schoolId,
          amountDollars: chargedAmount,
          mealLabel: meal,
          processedByUserId,
        })
        const user = await prisma.user.findFirst({
          where: { id: userId, schoolId: auth.schoolId },
        })
        const createdBy =
          "user" in auth && auth.user
            ? `${auth.user.firstName} ${auth.user.lastName}`.trim()
            : "Kiosk"
        const staffName = user ? `${user.firstName} ${user.lastName}`.trim() : "Staff"
        try {
          await deductInventoryForSale({
            schoolId: auth.schoolId,
            soldName: meal,
            soldLabel: `${staffName} · ${meal}`,
            createdBy,
          })
        } catch (error) {
          console.error("Inventory sale deduction failed", error)
        }
        return NextResponse.json(
          {
            balanceAfter: credit.balanceAfter,
            user: user ? mapUser(user) : undefined,
            meal,
            amount: chargedAmount,
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
