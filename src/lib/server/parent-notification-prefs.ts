import { DEFAULT_LOW_BALANCE_THRESHOLD } from "@/lib/parent-balance-alerts"

export type StoredParentNotificationPrefs = {
  mealNotifications?: boolean
  lowBalanceAlerts?: boolean
  depositConfirmations?: boolean
  weeklySummary?: boolean
  schoolAnnouncements?: boolean
  channelEmail?: boolean
  channelSms?: boolean
  channelPush?: boolean
  studentThresholds?: Record<string, number>
  pausedStudents?: string[]
}

export const DEFAULT_STORED_PREFS: Required<
  Pick<
    StoredParentNotificationPrefs,
    "lowBalanceAlerts" | "channelEmail" | "depositConfirmations"
  >
> = {
  lowBalanceAlerts: true,
  channelEmail: true,
  depositConfirmations: true,
}

export function parseStoredParentNotificationPrefs(
  raw: unknown
): StoredParentNotificationPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return raw as StoredParentNotificationPrefs
}

export function getStoredStudentThreshold(
  prefs: StoredParentNotificationPrefs,
  studentExternalId: string
): number {
  const value = prefs.studentThresholds?.[studentExternalId]
  if (typeof value === "number" && !Number.isNaN(value) && value >= 0) return value
  return DEFAULT_LOW_BALANCE_THRESHOLD
}

export function isLowBalanceEmailEnabled(
  prefs: StoredParentNotificationPrefs,
  studentExternalId: string
): boolean {
  if (prefs.lowBalanceAlerts === false) return false
  if (prefs.channelEmail === false) return false
  if (prefs.pausedStudents?.includes(studentExternalId)) return false
  return true
}
