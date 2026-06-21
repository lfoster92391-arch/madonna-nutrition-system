import type { StoredParentNotificationPrefs } from "@/lib/server/parent-notification-prefs"
import type { ChannelPrefs, ParentNotificationPrefs } from "@/lib/parent-balance-alerts"

function sessionHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (typeof window === "undefined") return headers
  try {
    const raw = sessionStorage.getItem("mnms-auth-session")
    if (raw) {
      const user = JSON.parse(raw) as { id?: string }
      if (user.id) headers["x-session-user-id"] = user.id
    }
  } catch {
    // ignore
  }
  return headers
}

export async function fetchServerNotificationPrefs(): Promise<StoredParentNotificationPrefs | null> {
  try {
    const res = await fetch("/api/parent/notification-prefs", { headers: sessionHeaders() })
    if (!res.ok) return null
    const data = (await res.json()) as { prefs?: StoredParentNotificationPrefs }
    return data.prefs ?? null
  } catch {
    return null
  }
}

export async function patchServerNotificationPrefs(
  patch: Partial<StoredParentNotificationPrefs>
): Promise<StoredParentNotificationPrefs | null> {
  try {
    const res = await fetch("/api/parent/notification-prefs", {
      method: "PATCH",
      headers: sessionHeaders(),
      body: JSON.stringify(patch),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { prefs?: StoredParentNotificationPrefs }
    return data.prefs ?? null
  } catch {
    return null
  }
}

export function serverPrefsToLocal(
  server: StoredParentNotificationPrefs
): { notification: ParentNotificationPrefs; channels: ChannelPrefs } {
  return {
    notification: {
      mealNotifications: server.mealNotifications ?? true,
      lowBalanceAlerts: server.lowBalanceAlerts ?? true,
      depositConfirmations: server.depositConfirmations ?? true,
      weeklySummary: server.weeklySummary ?? false,
      schoolAnnouncements: server.schoolAnnouncements ?? true,
    },
    channels: {
      email: server.channelEmail ?? true,
      sms: server.channelSms ?? false,
      push: server.channelPush ?? true,
    },
  }
}

export function localPrefsToServerPatch(input: {
  notification?: Partial<ParentNotificationPrefs>
  channels?: Partial<ChannelPrefs>
  studentThresholds?: Record<string, number>
  pausedStudents?: string[]
}): Partial<StoredParentNotificationPrefs> {
  return {
    ...(input.notification?.mealNotifications !== undefined
      ? { mealNotifications: input.notification.mealNotifications }
      : {}),
    ...(input.notification?.lowBalanceAlerts !== undefined
      ? { lowBalanceAlerts: input.notification.lowBalanceAlerts }
      : {}),
    ...(input.notification?.depositConfirmations !== undefined
      ? { depositConfirmations: input.notification.depositConfirmations }
      : {}),
    ...(input.notification?.weeklySummary !== undefined
      ? { weeklySummary: input.notification.weeklySummary }
      : {}),
    ...(input.notification?.schoolAnnouncements !== undefined
      ? { schoolAnnouncements: input.notification.schoolAnnouncements }
      : {}),
    ...(input.channels?.email !== undefined ? { channelEmail: input.channels.email } : {}),
    ...(input.channels?.sms !== undefined ? { channelSms: input.channels.sms } : {}),
    ...(input.channels?.push !== undefined ? { channelPush: input.channels.push } : {}),
    ...(input.studentThresholds ? { studentThresholds: input.studentThresholds } : {}),
    ...(input.pausedStudents ? { pausedStudents: input.pausedStudents } : {}),
  }
}
