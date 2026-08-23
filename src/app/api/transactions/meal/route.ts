import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapTransaction } from "@/lib/db/mappers"
import { findStudentByScanId } from "@/lib/db/students"
import { mealTransactionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireCashierOrApiKey } from "@/lib/api/session-auth"
import { maybeSendLowBalanceAlerts } from "@/lib/email/low-balance-alerts"
import { notifyParentsOfMealCharge } from "@/lib/parent/student-order-alerts"
import { canonicalMainMealPricing, isMainLunchKioskMeal } from "@/lib/lunch-pricing"
import { deductInventoryForSale } from "@/lib/operations/sale-deduction"
import { todayDateOnly } from "@/lib/teacher/db"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireCashierOrApiKey(request)
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = mealTransactionSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid meal transaction", parsed.error.flatten())
      }

      const { studentId, meal, amount, processedByUserId, mealType } = parsed.data
      const student = await findStudentByScanId(studentId)
      if (!student || student.disabled) {
        return notFound("Student not found or disabled")
      }

      const schoolId = auth.schoolId

      const todayMenu = isMainLunchKioskMeal(meal, mealType)
        ? await prisma.calendarEvent.findFirst({
            where: { schoolId, date: todayDateOnly(), category: "menu_day" },
            orderBy: { createdAt: "desc" },
            select: { title: true },
          })
        : null
      const chargedAmount = isMainLunchKioskMeal(meal, mealType)
        ? canonicalMainMealPricing({ menuTitle: todayMenu?.title }).totalAmount
        : amount

      if (processedByUserId) {
        const cashier = await prisma.user.findFirst({
          where: { id: processedByUserId, schoolId, status: "ACTIVE" },
        })
        if (!cashier || cashier.role === "PARENT") {
          return badRequest("Invalid cashier for this transaction")
        }
      }

      const balanceAfter = Number(student.balance) - chargedAmount
      const previousBalance = Number(student.balance)

      const [updatedStudent, transaction] = await prisma.$transaction([
        prisma.student.update({
          where: { id: student.id },
          data: { balance: balanceAfter },
        }),
        prisma.transaction.create({
          data: {
            studentId: student.id,
            schoolId,
            processedByUserId: processedByUserId ?? null,
            mealType: meal,
            amount: chargedAmount,
            balanceAfter,
          },
          include: {
            student: { select: { externalId: true, firstName: true, lastName: true } },
            processedBy: { select: { firstName: true, lastName: true, badgeId: true } },
          },
        }),
      ])

      void updatedStudent

      const createdBy =
        "user" in auth && auth.user
          ? `${auth.user.firstName} ${auth.user.lastName}`.trim()
          : transaction.processedBy
            ? `${transaction.processedBy.firstName} ${transaction.processedBy.lastName}`.trim()
            : "Kiosk"

      try {
        await deductInventoryForSale({
          schoolId,
          soldName: meal,
          soldLabel: `${student.firstName} ${student.lastName} · ${meal}`,
          createdBy,
        })
      } catch (error) {
        console.error("Inventory sale deduction failed", error)
      }

      void maybeSendLowBalanceAlerts({
        schoolId,
        studentId: student.id,
        studentExternalId: student.externalId,
        studentName: `${student.firstName} ${student.lastName}`,
        previousBalance,
        newBalance: balanceAfter,
      }).catch((error) => {
        console.error("Low balance alert failed", error)
      })

      void notifyParentsOfMealCharge({
        schoolId,
        studentId: student.id,
        studentExternalId: student.externalId,
        studentName: `${student.firstName} ${student.lastName}`,
        meal,
        amount: chargedAmount,
        previousBalance,
        newBalance: balanceAfter,
      }).catch((error) => {
        console.error("Meal charge alert failed", error)
      })

      return NextResponse.json(mapTransaction(transaction), { status: 201 })
    } catch (error) {
      console.error("POST /api/transactions/meal", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
