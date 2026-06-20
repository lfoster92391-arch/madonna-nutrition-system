import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mapTransaction } from "@/lib/db/mappers"
import { findStudentByScanId } from "@/lib/db/students"
import { mealTransactionSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireCashierOrApiKey } from "@/lib/api/session-auth"

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

      const { studentId, meal, amount, processedByUserId } = parsed.data
      const student = await findStudentByScanId(studentId)
      if (!student || student.disabled) {
        return notFound("Student not found or disabled")
      }

      const schoolId = auth.schoolId

      if (processedByUserId) {
        const cashier = await prisma.user.findFirst({
          where: { id: processedByUserId, schoolId, status: "ACTIVE" },
        })
        if (!cashier || cashier.role === "PARENT") {
          return badRequest("Invalid cashier for this transaction")
        }
      }

      const balanceAfter = Number(student.balance) - amount

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
            amount,
            balanceAfter,
          },
          include: {
            student: { select: { externalId: true, firstName: true, lastName: true } },
            processedBy: { select: { firstName: true, lastName: true, badgeId: true } },
          },
        }),
      ])

      void updatedStudent
      return NextResponse.json(mapTransaction(transaction), { status: 201 })
    } catch (error) {
      console.error("POST /api/transactions/meal", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
