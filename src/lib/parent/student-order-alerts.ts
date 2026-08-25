import { prisma } from "@/lib/prisma"
import {
  getStoredStudentThreshold,
  parseStoredParentNotificationPrefs,
} from "@/lib/server/parent-notification-prefs"
import { formatCurrency } from "@/lib/utils"

function formatMealLabel(mealType: string, sliceCount?: number | null): string {
  const base = mealType.replace(/_/g, " ").toLowerCase()
  if (sliceCount && sliceCount > 0) {
    return `${base} (${sliceCount} ${sliceCount === 1 ? "slice" : "slices"})`
  }
  return base
}

/** Parents linked via User.linkedStudentIds or ParentStudent join. */
export async function findLinkedParentUsersForStudent(input: {
  schoolId: string
  studentId: string
  studentExternalId: string
}) {
  const byLink = await prisma.user.findMany({
    where: {
      schoolId: input.schoolId,
      status: "ACTIVE",
      role: { in: ["PARENT", "STAFF", "TEACHER", "ADMIN"] },
      linkedStudentIds: { has: input.studentExternalId },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      notificationPrefs: true,
      linkedStudentIds: true,
    },
  })

  const parentLinks = await prisma.parentStudent.findMany({
    where: { studentId: input.studentId },
    include: { parent: { select: { email: true } } },
  })

  const emailsFromLinks = parentLinks.map((link) => link.parent.email.toLowerCase())
  const byEmail =
    emailsFromLinks.length === 0
      ? []
      : await prisma.user.findMany({
          where: {
            schoolId: input.schoolId,
            status: "ACTIVE",
            role: { in: ["PARENT", "STAFF", "TEACHER", "ADMIN"] },
            email: { in: emailsFromLinks },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            notificationPrefs: true,
            linkedStudentIds: true,
          },
        })

  const merged = new Map<string, (typeof byLink)[number]>()
  for (const user of [...byLink, ...byEmail]) {
    merged.set(user.id, user)
  }
  return [...merged.values()]
}

/**
 * In-app parent alerts when a student (or parent) places a lunch reservation.
 * Also surfaces low-balance / debt when the account is already low or the order amount
 * would push the projected balance below the parent's threshold.
 */
export async function notifyParentsOfStudentLunchOrder(input: {
  schoolId: string
  studentId: string
  studentExternalId: string
  studentName: string
  date: string
  mealType: string
  amount: number
  sliceCount?: number | null
  menuTitle?: string | null
  orderedBy: "student" | "parent" | "staff"
  currentBalance: number
}): Promise<{ notified: number }> {
  const parents = await findLinkedParentUsersForStudent({
    schoolId: input.schoolId,
    studentId: input.studentId,
    studentExternalId: input.studentExternalId,
  })

  const mealLabel = formatMealLabel(input.mealType, input.sliceCount)
  const amountLabel = formatCurrency(input.amount)
  const menuBit = input.menuTitle ? ` (${input.menuTitle})` : ""
  const who =
    input.orderedBy === "student"
      ? `${input.studentName} ordered lunch`
      : input.orderedBy === "staff"
        ? `School staff signed ${input.studentName} up for lunch`
        : `Lunch was ordered for ${input.studentName}`

  let notified = 0

  for (const parent of parents) {
    const prefs = parseStoredParentNotificationPrefs(parent.notificationPrefs)
    if (prefs.mealNotifications === false) continue

    await prisma.notification.create({
      data: {
        type: "STUDENT_LUNCH_ORDER",
        title: who,
        message: `${input.date}: ${mealLabel}${menuBit} · ${amountLabel}. Charged from the lunch account when the meal is served.`,
        channel: "EMAIL",
        emailSent: false,
        read: false,
        userId: parent.id,
        studentId: input.studentId,
        schoolId: input.schoolId,
        metadata: {
          date: input.date,
          mealType: input.mealType,
          amount: input.amount,
          sliceCount: input.sliceCount ?? null,
          menuTitle: input.menuTitle ?? null,
          orderedBy: input.orderedBy,
          studentExternalId: input.studentExternalId,
        },
      },
    })
    notified += 1

    const threshold = getStoredStudentThreshold(prefs, input.studentExternalId)
    const projected = input.currentBalance - input.amount

    if (input.currentBalance < 0 || projected < 0) {
      await prisma.notification.create({
        data: {
          type: "NEGATIVE_BALANCE",
          title: `Debt alert — ${input.studentName}`,
          message: `Lunch account is ${formatCurrency(input.currentBalance)} (projected ${formatCurrency(projected)} after this order). Add funds so lunch is not interrupted.`,
          channel: "EMAIL",
          emailSent: false,
          read: false,
          userId: parent.id,
          studentId: input.studentId,
          schoolId: input.schoolId,
          metadata: {
            balance: input.currentBalance,
            projectedBalance: projected,
            orderAmount: input.amount,
          },
        },
      })
    } else if (input.currentBalance < threshold || projected < threshold) {
      if (prefs.lowBalanceAlerts !== false) {
        await prisma.notification.create({
          data: {
            type: "LOW_BALANCE",
            title: `Low balance — ${input.studentName}`,
            message: `Balance ${formatCurrency(input.currentBalance)} (projected ${formatCurrency(projected)} after this ${amountLabel} order). Threshold: ${formatCurrency(threshold)}.`,
            channel: "EMAIL",
            emailSent: false,
            read: false,
            userId: parent.id,
            studentId: input.studentId,
            schoolId: input.schoolId,
            metadata: {
              balance: input.currentBalance,
              projectedBalance: projected,
              threshold,
              orderAmount: input.amount,
            },
          },
        })
      }
    }
  }

  return { notified }
}

/** In-app alert when the kiosk charges a student lunch account. */
export async function notifyParentsOfMealCharge(input: {
  schoolId: string
  studentId: string
  studentExternalId: string
  studentName: string
  meal: string
  amount: number
  previousBalance: number
  newBalance: number
}): Promise<{ notified: number }> {
  const parents = await findLinkedParentUsersForStudent({
    schoolId: input.schoolId,
    studentId: input.studentId,
    studentExternalId: input.studentExternalId,
  })

  let notified = 0
  for (const parent of parents) {
    const prefs = parseStoredParentNotificationPrefs(parent.notificationPrefs)
    if (prefs.mealNotifications === false) continue

    await prisma.notification.create({
      data: {
        type: "MEAL_CHARGE",
        title: `Lunch charged — ${input.studentName}`,
        message: `${input.meal}: ${formatCurrency(input.amount)} taken from the lunch account. New balance: ${formatCurrency(input.newBalance)}.`,
        channel: "EMAIL",
        emailSent: false,
        read: false,
        userId: parent.id,
        studentId: input.studentId,
        schoolId: input.schoolId,
        metadata: {
          meal: input.meal,
          amount: input.amount,
          previousBalance: input.previousBalance,
          newBalance: input.newBalance,
          studentExternalId: input.studentExternalId,
        },
      },
    })
    notified += 1
  }

  return { notified }
}
