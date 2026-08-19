import { NextResponse } from "next/server"
import {
  creditStudentDeposit,
  debitStudentBalance,
  isBalanceDebitError,
} from "@/lib/db/deposits"
import { findStudentByScanId } from "@/lib/db/students"
import { mapTransaction } from "@/lib/db/mappers"
import { officeDepositSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN", "CASHIER"])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = officeDepositSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid office payment", parsed.error.flatten())
      }

      const { studentId, amount, method, note, action } = parsed.data
      const student = await findStudentByScanId(studentId)
      if (!student || student.disabled) {
        return notFound("Student not found or disabled")
      }

      if (student.schoolId !== auth.schoolId) {
        return badRequest("Student does not belong to this school")
      }

      const ledger =
        action === "subtract"
          ? await debitStudentBalance({
              studentId: student.id,
              schoolId: auth.schoolId,
              amountDollars: amount,
              performedBy: auth.user.id,
              processedByUserId: auth.user.id,
              note,
            })
          : await creditStudentDeposit({
              studentId: student.id,
              schoolId: auth.schoolId,
              amountDollars: amount,
              performedBy: auth.user.id,
              processedByUserId: auth.user.id,
              method,
              note,
              source: "office",
            })

      const amountDebited = "amountDebited" in ledger ? ledger.amountDebited : undefined

      const transaction = await prisma.transaction.findUnique({
        where: { id: ledger.transactionId },
        include: {
          student: { select: { externalId: true, firstName: true, lastName: true } },
          processedBy: { select: { firstName: true, lastName: true, badgeId: true } },
        },
      })

      if (!transaction) {
        return NextResponse.json(
          {
            transactionId: ledger.transactionId,
            balanceAfter: ledger.balanceAfter,
            amountDebited,
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        {
          ...mapTransaction(transaction),
          balanceAfter: ledger.balanceAfter,
          amountDebited,
        },
        { status: 201 }
      )
    } catch (error) {
      if (isBalanceDebitError(error)) {
        return badRequest(error.message)
      }
      console.error("POST /api/transactions/office-deposit", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
