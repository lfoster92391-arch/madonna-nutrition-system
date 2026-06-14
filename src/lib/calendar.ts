import type { CalendarAccentColor, CalendarEvent, CalendarEventCategory } from "@/lib/types"

export const ACCENT_COLORS: Record<CalendarAccentColor, { label: string; hex: string }> = {
  navy: { label: "Navy", hex: "#001E62" },
  green: { label: "Green", hex: "#00A651" },
  amber: { label: "Amber", hex: "#F59E0B" },
}

export const EVENT_CATEGORIES: Record<
  CalendarEventCategory,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  menu_day: {
    label: "Lunch",
    color: "#00A83E",
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  holiday: {
    label: "Holiday",
    color: "#D62828",
    bgClass: "bg-danger/10",
    textClass: "text-danger",
  },
  early_dismissal: {
    label: "Early Dismissal",
    color: "#041B52",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
  },
  special_event: {
    label: "Special Event",
    color: "#2563EB",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
  },
  no_school: {
    label: "No School",
    color: "#94A3B8",
    bgClass: "bg-silver/30",
    textClass: "text-silver-foreground",
  },
  teacher_meal: {
    label: "Teacher Meal",
    color: "#F97316",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
  },
}

/** Categories shown in the admin calendar legend */
export const ADMIN_LEGEND_CATEGORIES: CalendarEventCategory[] = [
  "menu_day",
  "special_event",
  "teacher_meal",
  "holiday",
  "no_school",
]

export function getEventColor(event: CalendarEvent): string {
  return event.color ?? EVENT_CATEGORIES[event.category].color
}

export function getAccentHex(accent: CalendarAccentColor): string {
  return ACCENT_COLORS[accent].hex
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

export function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d))

  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatMonthYear(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

export function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const existing = map.get(event.date) ?? []
    map.set(event.date, [...existing, event])
  }
  return map
}

export { WEEKDAYS }
