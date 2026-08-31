import { NextResponse } from "next/server"
import {
  creditStaffDeposit,
  debitStaffBalance,
  isBalanceDebitError,
} from "@/lib/db/deposits"
import { mapUser } from "@/lib/db/mappers"
import { staffDepositSchema } from "@/lib/api/validation"
import { badRequest, notFound, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["ADMIN", "CASHIER"])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = staffDepositSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid staff payment", parsed.error.flatten())
      }

      const { userId, amount, method, note, action, allowNegative } = parsed.data
      const staffUser = await prisma.user.findFirst({
        where: {
          id: userId,
          schoolId: auth.schoolId,
          status: "ACTIVE",
          role: { in: ["STAFF", "TEACHER", "CASHIER", "ADMIN"] },
        },
      })

      if (!staffUser) {
        return notFound("Staff account not found")
      }

      const mayAllowNegative =
        Boolean(allowNegative) && (auth.user.role === "ADMIN" || auth.user.role === "CASHIER")

      const ledger =
        action === "subtract"
          ? await debitStaffBalance({
              userId: staffUser.id,
              schoolId: auth.schoolId,
              amountDollars: amount,
              performedBy: auth.user.id,
              processedByUserId: auth.user.id,
              note,
              allowNegative: mayAllowNegative,
            })
          : await creditStaffDeposit({
              userId: staffUser.id,
              schoolId: auth.schoolId,
              amountDollars: amount,
              performedBy: auth.user.id,
              processedByUserId: auth.user.id,
              method,
              note,
            })

      const updated = await prisma.user.findUnique({ where: { id: staffUser.id } })

      return NextResponse.json(
        {
          balanceAfter: ledger.balanceAfter,
          amountDebited: "amountDebited" in ledger ? ledger.amountDebited : undefined,
          user: updated ? mapUser(updated) : undefined,
        },
        { status: 201 }
      )
    } catch (error) {
      if (isBalanceDebitError(error)) {
        return badRequest(error.message)
      }
      console.error("POST /api/transactions/staff-deposit", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
