import { getMealCoverPhoto } from "@/lib/meal-templates"
import type { CalendarEvent, MealTemplate } from "@/lib/types"

export function getEventCoverPhoto(
  event: CalendarEvent,
  mealTemplatesById?: Map<string, MealTemplate>
): string | undefined {
  if (!event.mealTemplateId) return undefined
  const template = mealTemplatesById?.get(event.mealTemplateId)
  return template ? getMealCoverPhoto(template.photos) : undefined
}

/** Prefer lunch/menu events for week strip preview */
export function getPrimaryDayEvent(events: CalendarEvent[]): CalendarEvent | undefined {
  if (events.length === 0) return undefined
  return events.find((e) => e.category === "menu_day") ?? events[0]
}
