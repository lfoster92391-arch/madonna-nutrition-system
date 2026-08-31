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

export class BalanceDebitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BalanceDebitError"
  }
}

export function isBalanceDebitError(error: unknown): error is BalanceDebitError {
  return error instanceof BalanceDebitError || (error instanceof Error && error.name === "BalanceDebitError")
}

function mealTypeForDebit(note?: string): string {
  const trimmed = note?.trim()
  if (!trimmed) return "Money taken off"
  const short = trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed
  return `Money taken off — ${short}`
}

export interface DebitStudentBalanceInput {
  studentId: string
  schoolId: string
  amountDollars: number
  performedBy?: string
  processedByUserId?: string
  note?: string
  /**
   * When true (admin/office correction), balance may go below $0 (debt).
   * When false (default), clamps at $0 — kiosk take-off stays non-negative.
   */
  allowNegative?: boolean
}

/**
 * Take money off a student lunch account (correction, refund, or mistake).
 * Records a negative DEPOSIT so history is not a silent overwrite and not a meal charge.
 * By default clamps at $0. Pass allowNegative for office debt / unpaid-lunch corrections.
 * Meal charges may still go negative independently of this path.
 */
export async function debitStudentBalance(
  input: DebitStudentBalanceInput
): Promise<{ transactionId: string; balanceAfter: number; amountDebited: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const requested = new Prisma.Decimal(input.amountDollars.toFixed(2))
  if (requested.lte(0)) {
    throw new BalanceDebitError("Enter an amount greater than $0.")
  }

  const allowNegative = Boolean(input.allowNegative)

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

    if (!allowNegative && student.balance.lte(0)) {
      throw new BalanceDebitError("Nothing to take off. Balance is already $0 or less.")
    }

    const amountDebited =
      !allowNegative && requested.gt(student.balance) ? student.balance : requested
    const balanceAfter = student.balance.sub(amountDebited)
    const ledgerAmount = amountDebited.mul(-1)
    const mealType = mealTypeForDebit(input.note)

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
        amount: ledgerAmount,
        balanceAfter,
        processedByUserId: input.processedByUserId ?? null,
      },
    })

    await tx.auditLog.create({
      data: {
        action: "FUNDS_REMOVED",
        entity: "student_balance",
        entityType: "student",
        entityId: input.studentId,
        performedBy: input.performedBy ?? "office_staff",
        schoolId: input.schoolId,
        metadata: {
          amountRequested: input.amountDollars,
          amountDebited: Number(amountDebited),
          clamped: !allowNegative && amountDebited.lt(requested),
          allowNegative,
          source: "office",
          note: input.note?.trim() || null,
        },
        previousValue: { balance: Number(student.balance) },
        newValue: { balance: Number(balanceAfter) },
      },
    })

    return {
      transactionId: transaction.id,
      balanceAfter: Number(balanceAfter),
      amountDebited: Number(amountDebited),
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

export interface DebitStaffBalanceInput {
  userId: string
  schoolId: string
  amountDollars: number
  performedBy?: string
  processedByUserId?: string
  note?: string
  /** When true, staff lunch balance may go below $0. Default clamps at $0. */
  allowNegative?: boolean
}

/**
 * Take money off a staff lunch account. Audit-only (staff deposits are not student ledger rows).
 * By default clamps at $0. Pass allowNegative for office debt corrections.
 */
export async function debitStaffBalance(
  input: DebitStaffBalanceInput
): Promise<{ balanceAfter: number; amountDebited: number }> {
  if (!isDatabaseEnabled()) {
    throw new Error("DATABASE_URL is not configured")
  }

  const requested = new Prisma.Decimal(input.amountDollars.toFixed(2))
  if (requested.lte(0)) {
    throw new BalanceDebitError("Enter an amount greater than $0.")
  }

  const allowNegative = Boolean(input.allowNegative)

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

    if (!allowNegative && staffUser.accountBalance.lte(0)) {
      throw new BalanceDebitError("Nothing to take off. Balance is already $0 or less.")
    }

    const amountDebited =
      !allowNegative && requested.gt(staffUser.accountBalance)
        ? staffUser.accountBalance
        : requested
    const balanceAfter = staffUser.accountBalance.sub(amountDebited)

    await tx.user.update({
      where: { id: staffUser.id },
      data: { accountBalance: balanceAfter },
    })

    await tx.auditLog.create({
      data: {
        action: "FUNDS_REMOVED",
        entity: "staff_balance",
        entityType: "user",
        entityId: staffUser.id,
        performedBy: input.performedBy ?? input.processedByUserId ?? "office_staff",
        schoolId: input.schoolId,
        metadata: {
          amountRequested: input.amountDollars,
          amountDebited: Number(amountDebited),
          clamped: !allowNegative && amountDebited.lt(requested),
          allowNegative,
          source: "office",
          note: input.note?.trim() || null,
          mealType: mealTypeForDebit(input.note),
          staffName: `${staffUser.firstName} ${staffUser.lastName}`,
        },
        previousValue: { accountBalance: Number(staffUser.accountBalance) },
        newValue: { accountBalance: Number(balanceAfter) },
      },
    })

    return {
      balanceAfter: Number(balanceAfter),
      amountDebited: Number(amountDebited),
    }
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
