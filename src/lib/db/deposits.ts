import { Prisma, TransactionType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"

export interface CreditDepositInput {
  studentId: string
  schoolId: string
  amountDollars: number
  stripeSessionId: string
  performedBy?: string
}

export async function creditStudentDeposit(
  input: CreditDepositInput
): Promise<{ transactionId: string; balanceAfter: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const existing = await prisma.transaction.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
    select: { id: true, balanceAfter: true },
  })

  if (existing) {
    return {
      transactionId: existing.id,
      balanceAfter: Number(existing.balanceAfter),
    }
  }

  const amount = new Prisma.Decimal(input.amountDollars.toFixed(2))

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, balance: true, schoolId: true },
    })

    if (!student) {
      throw new Error("Student not found")
    }

    if (student.schoolId !== input.schoolId) {
      throw new Error("Student does not belong to this school")
    }

    const balanceAfter = student.balance.add(amount)

    await tx.student.update({
      where: { id: input.studentId },
      data: { balance: balanceAfter },
    })

    const transaction = await tx.transaction.create({
      data: {
        studentId: input.studentId,
        schoolId: input.schoolId,
        type: TransactionType.DEPOSIT,
        mealType: "Card Deposit",
        amount,
        balanceAfter,
        stripeSessionId: input.stripeSessionId,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "FUNDS_ADDED",
        entity: "student_balance",
        entityType: "student",
        entityId: input.studentId,
        performedBy: input.performedBy ?? "stripe_webhook",
        schoolId: input.schoolId,
        metadata: {
          amount: input.amountDollars,
          stripeSessionId: input.stripeSessionId,
          source: "stripe_checkout",
        },
        newValue: { balance: Number(balanceAfter) },
      },
    })

    return {
      transactionId: transaction.id,
      balanceAfter: Number(balanceAfter),
    }
  })
}
