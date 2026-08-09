import { Prisma, TransactionType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"

export type OfficePaymentMethod = "cash" | "check" | "card" | "other"

export interface CreditDepositInput {
  studentId: string
  schoolId: string
  amountDollars: number
  /** Stripe Checkout session id — required for online deposits; omit for office payments. */
  stripeSessionId?: string
  performedBy?: string
  processedByUserId?: string
  method?: OfficePaymentMethod
  note?: string
  source?: "stripe_checkout" | "office"
}

function mealTypeForDeposit(input: CreditDepositInput): string {
  if (input.source === "office" || (!input.stripeSessionId && input.method)) {
    const methodLabel =
      input.method === "cash"
        ? "Cash"
        : input.method === "check"
          ? "Check"
          : input.method === "card"
            ? "Card"
            : "Other"
    return `Office Deposit (${methodLabel})`
  }
  return "Card Deposit"
}

export async function creditStudentDeposit(
  input: CreditDepositInput
): Promise<{ transactionId: string; balanceAfter: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  if (input.stripeSessionId) {
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
  }

  const amount = new Prisma.Decimal(input.amountDollars.toFixed(2))
  const source = input.source ?? (input.stripeSessionId ? "stripe_checkout" : "office")
  const mealType = mealTypeForDeposit({ ...input, source })

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
        mealType,
        amount,
        balanceAfter,
        stripeSessionId: input.stripeSessionId ?? null,
        processedByUserId: input.processedByUserId ?? null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "FUNDS_ADDED",
        entity: "student_balance",
        entityType: "student",
        entityId: input.studentId,
        performedBy: input.performedBy ?? (source === "office" ? "office_staff" : "stripe_webhook"),
        schoolId: input.schoolId,
        metadata: {
          amount: input.amountDollars,
          stripeSessionId: input.stripeSessionId ?? null,
          source,
          method: input.method ?? null,
          note: input.note?.trim() || null,
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

export interface CreditStaffDepositInput {
  userId: string
  schoolId: string
  amountDollars: number
  performedBy?: string
  processedByUserId?: string
  method?: OfficePaymentMethod
  note?: string
}

/** Credit a staff/teacher lunch account (User.accountBalance). */
export async function creditStaffDeposit(
  input: CreditStaffDepositInput
): Promise<{ balanceAfter: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const amount = new Prisma.Decimal(input.amountDollars.toFixed(2))
  const methodLabel =
    input.method === "cash"
      ? "Cash"
      : input.method === "check"
        ? "Check"
        : input.method === "card"
          ? "Card"
          : "Other"

  return prisma.$transaction(async (tx) => {
    const staffUser = await tx.user.findFirst({
      where: {
        id: input.userId,
        schoolId: input.schoolId,
        status: "ACTIVE",
        role: { in: ["STAFF", "TEACHER", "CASHIER", "ADMIN"] },
      },
      select: { id: true, accountBalance: true, firstName: true, lastName: true },
    })

    if (!staffUser) {
      throw new Error("Staff account not found")
    }

    const balanceAfter = staffUser.accountBalance.add(amount)

    await tx.user.update({
      where: { id: staffUser.id },
      data: { accountBalance: balanceAfter },
    })

    await tx.auditLog.create({
      data: {
        action: "FUNDS_ADDED",
        entity: "staff_balance",
        entityType: "user",
        entityId: staffUser.id,
        performedBy: input.performedBy ?? input.processedByUserId ?? "office_staff",
        schoolId: input.schoolId,
        metadata: {
          amount: input.amountDollars,
          source: "office",
          method: input.method ?? "cash",
          note: input.note?.trim() || null,
          mealType: `Staff Office Deposit (${methodLabel})`,
          staffName: `${staffUser.firstName} ${staffUser.lastName}`,
        },
        newValue: { accountBalance: Number(balanceAfter) },
      },
    })

    return { balanceAfter: Number(balanceAfter) }
  })
}

export interface DebitStaffMealInput {
  userId: string
  schoolId: string
  amountDollars: number
  mealLabel: string
  processedByUserId?: string
  performedBy?: string
}

/** Debit a staff/teacher lunch account for a kiosk meal. */
export async function debitStaffMeal(
  input: DebitStaffMealInput
): Promise<{ balanceAfter: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const amount = new Prisma.Decimal(input.amountDollars.toFixed(2))

  return prisma.$transaction(async (tx) => {
    const staffUser = await tx.user.findFirst({
      where: {
        id: input.userId,
        schoolId: input.schoolId,
        status: "ACTIVE",
        role: { in: ["STAFF", "TEACHER", "CASHIER", "ADMIN"] },
      },
      select: { id: true, accountBalance: true, firstName: true, lastName: true },
    })

    if (!staffUser) {
      throw new Error("Staff account not found or disabled")
    }

    const balanceAfter = staffUser.accountBalance.sub(amount)

    await tx.user.update({
      where: { id: staffUser.id },
      data: { accountBalance: balanceAfter },
    })

    await tx.auditLog.create({
      data: {
        action: "MEAL_PURCHASE",
        entity: "staff_balance",
        entityType: "user",
        entityId: staffUser.id,
        performedBy: input.performedBy ?? input.processedByUserId ?? "kiosk",
        schoolId: input.schoolId,
        metadata: {
          amount: input.amountDollars,
          mealType: input.mealLabel,
          source: "kiosk",
          staffName: `${staffUser.firstName} ${staffUser.lastName}`,
        },
        newValue: { accountBalance: Number(balanceAfter) },
      },
    })

    return { balanceAfter: Number(balanceAfter) }
  })
}
