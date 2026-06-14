import type { LunchPaymentMethod } from "@prisma/client"
import type { TeacherPaymentMethod } from "@/lib/teacher/types"

export function toDbPaymentMethod(method: TeacherPaymentMethod): LunchPaymentMethod {
  const map: Record<TeacherPaymentMethod, LunchPaymentMethod> = {
    account: "ACCOUNT",
    prepay_online: "PREPAY_ONLINE",
    pay_at_kiosk: "PAY_AT_KIOSK",
  }
  return map[method]
}

export function fromDbPaymentMethod(method: LunchPaymentMethod): TeacherPaymentMethod {
  const map: Record<LunchPaymentMethod, TeacherPaymentMethod> = {
    ACCOUNT: "account",
    PREPAY_ONLINE: "prepay_online",
    PAY_AT_KIOSK: "pay_at_kiosk",
  }
  return map[method]
}

export function todayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}
