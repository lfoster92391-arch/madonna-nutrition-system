import { isWeekendDateKey } from "@/lib/calendar"
import type { CalendarEvent, CalendarPublishStatus } from "@/lib/types"

/** Events visible on parent, staff, and teacher portals. */
export function isPublicCalendarEvent(event: CalendarEvent): boolean {
  if ((event.publishStatus ?? "draft") !== "published") return false
  // Never surface school lunch menus on weekends, even if mis-scheduled in admin.
  if (event.category === "menu_day" && isWeekendDateKey(event.date)) return false
  return true
}

export function filterPublicCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(isPublicCalendarEvent)
}

export function publishStatusLabel(status?: CalendarPublishStatus): string {
  switch (status ?? "draft") {
    case "published":
      return "Published"
    case "scheduled":
      return "Scheduled"
    case "archived":
      return "Archived"
    default:
      return "Draft"
  }
}

export function publishStatusBadgeClass(status?: CalendarPublishStatus): string {
  switch (status ?? "draft") {
    case "published":
      return "bg-success/10 text-success"
    case "scheduled":
      return "bg-warning/10 text-warning"
    case "archived":
      return "bg-silver/20 text-silver-foreground"
    default:
      return "bg-primary/10 text-primary"
  }
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}
