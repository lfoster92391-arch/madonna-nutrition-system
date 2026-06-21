import { NextResponse } from "next/server"
import { z } from "zod"
import { badRequest, serverError, withDatabase } from "@/lib/api/response"
import { requireMutatingSession } from "@/lib/api/session-auth"
import {
  parseStoredParentNotificationPrefs,
  type StoredParentNotificationPrefs,
} from "@/lib/server/parent-notification-prefs"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  mealNotifications: z.boolean().optional(),
  lowBalanceAlerts: z.boolean().optional(),
  depositConfirmations: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  schoolAnnouncements: z.boolean().optional(),
  channelEmail: z.boolean().optional(),
  channelSms: z.boolean().optional(),
  channelPush: z.boolean().optional(),
  studentThresholds: z.record(z.string(), z.number().min(0)).optional(),
  pausedStudents: z.array(z.string()).optional(),
})

function mergePrefs(
  current: StoredParentNotificationPrefs,
  patch: z.infer<typeof patchSchema>
): StoredParentNotificationPrefs {
  return {
    ...current,
    ...patch,
    studentThresholds: patch.studentThresholds
      ? { ...current.studentThresholds, ...patch.studentThresholds }
      : current.studentThresholds,
    pausedStudents: patch.pausedStudents ?? current.pausedStudents,
  }
}

export async function GET(request: Request) {
  const result = await withDatabase(async () => {
    const auth = await requireMutatingSession(request, ["PARENT"])
    if ("error" in auth) return auth.error

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { notificationPrefs: true },
    })

    return NextResponse.json({
      prefs: parseStoredParentNotificationPrefs(user?.notificationPrefs),
    })
  })
  return result instanceof NextResponse ? result : result
}

export async function PATCH(request: Request) {
  const result = await withDatabase(async () => {
    try {
      const auth = await requireMutatingSession(request, ["PARENT"])
      if ("error" in auth) return auth.error

      const body = await request.json()
      const parsed = patchSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest("Invalid notification preferences", parsed.error.flatten())
      }

      const existing = await prisma.user.findUnique({
        where: { id: auth.user.id },
        select: { notificationPrefs: true },
      })

      const merged = mergePrefs(
        parseStoredParentNotificationPrefs(existing?.notificationPrefs),
        parsed.data
      )

      await prisma.user.update({
        where: { id: auth.user.id },
        data: { notificationPrefs: merged },
      })

      return NextResponse.json({ prefs: merged })
    } catch (error) {
      console.error("PATCH /api/parent/notification-prefs", error)
      return serverError()
    }
  })
  return result instanceof NextResponse ? result : result
}
