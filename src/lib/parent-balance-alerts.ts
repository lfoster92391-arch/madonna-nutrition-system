const THRESHOLD_KEY = "mnms-parent-balance-threshold"
const PAUSED_KEY = "mnms-parent-balance-paused"
const NOTIFICATION_PREFS_KEY = "mnms-parent-notification-prefs"
const CHANNEL_PREFS_KEY = "mnms-parent-channel-prefs"
const AUTO_RELOAD_KEY = "mnms-parent-auto-reload"

export const DEFAULT_LOW_BALANCE_THRESHOLD = 10

export type ParentNotificationPrefs = {
  mealNotifications: boolean
  lowBalanceAlerts: boolean
  depositConfirmations: boolean
  weeklySummary: boolean
  schoolAnnouncements: boolean
}

export type ChannelPrefs = {
  email: boolean
  sms: boolean
  push: boolean
}

export type AutoReloadPrefs = {
  enabled: boolean
  triggerAmount: number
  depositAmount: number
}

const DEFAULT_NOTIFICATION_PREFS: ParentNotificationPrefs = {
  mealNotifications: true,
  lowBalanceAlerts: true,
  depositConfirmations: true,
  weeklySummary: false,
  schoolAnnouncements: true,
}

const DEFAULT_CHANNEL_PREFS: ChannelPrefs = {
  email: true,
  sms: false,
  push: true,
}

const DEFAULT_AUTO_RELOAD: AutoReloadPrefs = {
  enabled: false,
  triggerAmount: 10,
  depositAmount: 25,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

function readThresholdMap(): Record<string, number> {
  return readJson<Record<string, number>>(THRESHOLD_KEY, {})
}

function readPausedMap(): Record<string, boolean> {
  return readJson<Record<string, boolean>>(PAUSED_KEY, {})
}

export function getStudentThreshold(studentId: string): number {
  const map = readThresholdMap()
  return map[studentId] ?? DEFAULT_LOW_BALANCE_THRESHOLD
}

export function setStudentThreshold(studentId: string, amount: number) {
  const map = readThresholdMap()
  map[studentId] = Math.max(0, amount)
  writeJson(THRESHOLD_KEY, map)
}

export function isAlertsPaused(studentId: string): boolean {
  return readPausedMap()[studentId] ?? false
}

export function setAlertsPaused(studentId: string, paused: boolean) {
  const map = readPausedMap()
  map[studentId] = paused
  writeJson(PAUSED_KEY, map)
}

export function getNotificationPrefs(): ParentNotificationPrefs {
  return readJson(NOTIFICATION_PREFS_KEY, DEFAULT_NOTIFICATION_PREFS)
}

export function setNotificationPrefs(prefs: Partial<ParentNotificationPrefs>) {
  writeJson(NOTIFICATION_PREFS_KEY, { ...getNotificationPrefs(), ...prefs })
}

export function getChannelPrefs(): ChannelPrefs {
  return readJson(CHANNEL_PREFS_KEY, DEFAULT_CHANNEL_PREFS)
}

export function setChannelPrefs(prefs: Partial<ChannelPrefs>) {
  writeJson(CHANNEL_PREFS_KEY, { ...getChannelPrefs(), ...prefs })
}

export function getAutoReloadPrefs(): AutoReloadPrefs {
  return readJson(AUTO_RELOAD_KEY, DEFAULT_AUTO_RELOAD)
}

export function setAutoReloadPrefs(prefs: Partial<AutoReloadPrefs>) {
  writeJson(AUTO_RELOAD_KEY, { ...getAutoReloadPrefs(), ...prefs })
}

export function isStudentBelowThreshold(
  student: { id: string; balance: number },
  threshold?: number
): boolean {
  if (!getNotificationPrefs().lowBalanceAlerts) return false
  if (isAlertsPaused(student.id)) return false
  const limit = threshold ?? getStudentThreshold(student.id)
  return student.balance < limit
}

export function getLowBalanceStudents<T extends { id: string; firstName: string; lastName: string; balance: number }>(
  students: T[]
): T[] {
  return students.filter((s) => isStudentBelowThreshold(s))
}
