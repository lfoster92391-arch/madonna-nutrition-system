/** Madonna High School (Weirton, WV) local calendar day. */
export const SCHOOL_TIME_ZONE = "America/New_York"

export function schoolDateKey(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: SCHOOL_TIME_ZONE })
}

export function addDateKeyDays(dateKey: string, days: number): string {
  const utc = new Date(`${dateKey}T12:00:00.000Z`)
  utc.setUTCDate(utc.getUTCDate() + days)
  return utc.toISOString().slice(0, 10)
}

export function weekdayIndexMonday0(dateKey: string): number {
  const utcDay = new Date(`${dateKey}T12:00:00.000Z`).getUTCDay()
  return (utcDay + 6) % 7
}

/** Monday–Friday date keys for the school week containing `dateKey`. */
export function schoolWeekdayKeys(dateKey: string): string[] {
  const mondayOffset = weekdayIndexMonday0(dateKey)
  const monday = addDateKeyDays(dateKey, -mondayOffset)
  return [0, 1, 2, 3, 4].map((i) => addDateKeyDays(monday, i))
}

export function isMondayDateKey(dateKey: string): boolean {
  return weekdayIndexMonday0(dateKey) === 0
}

/** Noon UTC on the calendar date — matches lunch reservation / menu_day storage. */
export function dateKeyUtcNoon(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00.000Z`)
}

function etOffsetIso(dateKey: string): string {
  const probe = new Date(`${dateKey}T12:00:00.000Z`)
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TIME_ZONE,
    timeZoneName: "shortOffset",
    hour: "numeric",
  }).formatToParts(probe)
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4"
  const match = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return "-04:00"
  const hour = match[2].padStart(2, "0")
  const minute = (match[3] ?? "00").padStart(2, "0")
  return `${match[1]}${hour}:${minute}`
}

/** Inclusive start / exclusive end covering a school-local calendar day. */
export function schoolDayInstantRange(dateKey: string): { start: Date; endExclusive: Date } {
  const next = addDateKeyDays(dateKey, 1)
  return {
    start: new Date(`${dateKey}T00:00:00.000${etOffsetIso(dateKey)}`),
    endExclusive: new Date(`${next}T00:00:00.000${etOffsetIso(next)}`),
  }
}

export function formatSchoolWeekday(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}
