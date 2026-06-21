import { prisma } from "@/lib/prisma"
import { sendLowBalanceEmail } from "@/lib/email"
import { PARENT_PORTAL_URL } from "@/lib/email/templates"
import {
  getStoredStudentThreshold,
  isLowBalanceEmailEnabled,
  parseStoredParentNotificationPrefs,
} from "@/lib/server/parent-notification-prefs"

const DEDUP_HOURS = 24

function formatBalance(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

async function findParentUsersForStudent(input: {
  schoolId: string
  studentId: string
  studentExternalId: string
}) {
  const byLink = await prisma.user.findMany({
    where: {
      schoolId: input.schoolId,
      role: "PARENT",
      status: "ACTIVE",
      linkedStudentIds: { has: input.studentExternalId },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      notificationPrefs: true,
    },
  })

  const parentLinks = await prisma.parentStudent.findMany({
    where: { studentId: input.studentId },
    include: { parent: { select: { email: true } } },
  })

  const emailsFromLinks = parentLinks.map((link) => link.parent.email.toLowerCase())
  if (emailsFromLinks.length === 0) return byLink

  const byEmail = await prisma.user.findMany({
    where: {
      schoolId: input.schoolId,
      role: "PARENT",
      status: "ACTIVE",
      email: { in: emailsFromLinks },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      notificationPrefs: true,
    },
  })

  const merged = new Map<string, (typeof byLink)[number]>()
  for (const user of [...byLink, ...byEmail]) {
    merged.set(user.id, user)
  }
  return [...merged.values()]
}

async function recentlyNotified(input: {
  userId: string
  studentId: string
}): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000)
  const existing = await prisma.notification.findFirst({
    where: {
      userId: input.userId,
      studentId: input.studentId,
      type: "LOW_BALANCE",
      emailSent: true,
      createdAt: { gte: since },
    },
    select: { id: true },
  })
  return Boolean(existing)
}

export async function maybeSendLowBalanceAlerts(input: {
  schoolId: string
  studentId: string
  studentExternalId: string
  studentName: string
  previousBalance: number
  newBalance: number
}): Promise<{ sent: number; skipped: number }> {
  const parents = await findParentUsersForStudent({
    schoolId: input.schoolId,
    studentId: input.studentId,
    studentExternalId: input.studentExternalId,
  })

  let sent = 0
  let skipped = 0

  for (const parent of parents) {
    const prefs = parseStoredParentNotificationPrefs(parent.notificationPrefs)
    if (!isLowBalanceEmailEnabled(prefs, input.studentExternalId)) {
      skipped += 1
      continue
    }

    const threshold = getStoredStudentThreshold(prefs, input.studentExternalId)
    const crossedThreshold =
      input.previousBalance >= threshold && input.newBalance < threshold

    if (!crossedThreshold) {
      skipped += 1
      continue
    }

    if (await recentlyNotified({ userId: parent.id, studentId: input.studentId })) {
      skipped += 1
      continue
    }

    const delivery = await sendLowBalanceEmail({
      to: parent.email,
      studentName: input.studentName,
      balance: formatBalance(input.newBalance),
      userId: parent.id,
      studentId: input.studentId,
      addFundsUrl: `${PARENT_PORTAL_URL}/parent/payments`,
    })

    if (delivery.sent) sent += 1
    else skipped += 1
  }

  return { sent, skipped }
}
