"use client"

import { useMemo } from "react"
import Image from "next/image"
import {
  CATEGORY_ICONS,
  type CalendarDayReservationMark,
} from "@/components/calendar/CalendarMonthGrid"
import {
  getEventCoverPhoto,
  getPrimaryDayEvent,
} from "@/components/calendar/calendar-event-media"
import {
  EVENT_CATEGORIES,
  formatDateKey,
  getEventColor,
  getWeekDates,
} from "@/lib/calendar"
import type { CalendarEvent, MealTemplate } from "@/lib/types"
import { isLocalMealPhotoUrl } from "@/lib/meal-templates"
import { cn } from "@/lib/utils"

interface CalendarWeekOutlookProps {
  weekStart: Date
  events: CalendarEvent[]
  accentHex: string
  selectedDate?: string | null
  onDayClick?: (dateKey: string) => void
  /** When set (admin), tapping a day with a menu opens that event for Edit/Delete */
  onEventClick?: (event: CalendarEvent) => void
  selectedEventId?: string | null
  readOnly?: boolean
  mealTemplatesById?: Map<string, MealTemplate>
  reservationsByDate?: Map<string, CalendarDayReservationMark[]>
}

export function CalendarWeekOutlook({
  weekStart,
  events,
  accentHex,
  selectedDate,
  onDayClick,
  onEventClick,
  selectedEventId,
  readOnly = false,
  mealTemplatesById,
  reservationsByDate,
}: CalendarWeekOutlookProps) {
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const todayKey = formatDateKey(new Date())

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const existing = map.get(event.date) ?? []
      map.set(event.date, [...existing, event])
    }
    return map
  }, [events])

  return (
    <div className="overflow-hidden rounded-[20px] border border-silver/60 bg-white md:hidden">
      <div className="-mx-1 overflow-x-auto px-3 pb-3 pt-1">
        <div className="flex min-w-max gap-3.5 p-1">
          {weekDates.map((date) => {
            const dateKey = formatDateKey(date)
            const dayEvents = eventsByDate.get(dateKey) ?? []
            const dayReservations = reservationsByDate?.get(dateKey) ?? []
            const primaryEvent = getPrimaryDayEvent(dayEvents)
            const isToday = dateKey === todayKey
            const isSelected = selectedDate === dateKey
            const cover = primaryEvent
              ? getEventCoverPhoto(primaryEvent, mealTemplatesById)
              : undefined
            const category = primaryEvent?.category
            const Icon = category ? CATEGORY_ICONS[category] : null
            const color = primaryEvent ? getEventColor(primaryEvent) : accentHex
            const overflow = dayEvents.length > 1 ? dayEvents.length - 1 : 0
            const reservedLabel =
              dayReservations.length === 1
                ? `Reserved for ${dayReservations[0]!.studentName.trim().split(/\s+/)[0]}`
                : dayReservations.length > 1
                  ? `${dayReservations.length} reserved`
                  : null

            const eventFocused = Boolean(primaryEvent && selectedEventId === primaryEvent.id)
            const canOpenEvent = Boolean(onEventClick) && !readOnly && Boolean(primaryEvent)

            return (
              <button
                key={dateKey}
                type="button"
                disabled={readOnly && !onDayClick}
                onClick={() => {
                  if (canOpenEvent && primaryEvent) {
                    onEventClick?.(primaryEvent)
                    return
                  }
                  onDayClick?.(dateKey)
                }}
                aria-pressed={isSelected}
                aria-label={
                  canOpenEvent && primaryEvent
                    ? `${date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}, ${primaryEvent.title}, open Edit or Delete`
                    : `${date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}${reservedLabel ? `, ${reservedLabel}` : ""}`
                }
                className={cn(
                  "flex min-h-[11.5rem] w-[7.5rem] shrink-0 flex-col items-center gap-2.5 rounded-2xl border border-silver/50 bg-white p-3.5 text-left transition min-[420px]:w-[7.75rem]",
                  readOnly ? "cursor-default" : "cursor-pointer hover:border-primary/30 hover:bg-primary/5",
                  isSelected && "border-primary/40 bg-primary/5 ring-2 ring-inset ring-primary/25",
                  eventFocused && "border-primary bg-primary/10 ring-2 ring-inset ring-primary/40",
                  isToday && !isSelected && "border-primary/20 bg-success/5",
                  dayReservations.length > 0 && "border-success/40"
                )}
                style={isSelected || eventFocused ? { boxShadow: `inset 0 0 0 1px ${accentHex}` } : undefined}
              >
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary/60">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={cn(
                      "mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-base font-bold",
                      isToday ? "text-white" : "text-primary"
                    )}
                    style={isToday ? { backgroundColor: accentHex } : undefined}
                  >
                    {date.getDate()}
                  </p>
                </div>

                {reservedLabel ? (
                  <span
                    className="max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: dayReservations[0]!.color }}
                  >
                    ✓ {reservedLabel}
                  </span>
                ) : null}

                {primaryEvent ? (
                  <div className="flex w-full flex-col items-center gap-1.5">
                    {cover ? (
                      <span className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-silver/40 shadow-sm">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                          unoptimized={isLocalMealPhotoUrl(cover)}
                        />
                      </span>
                    ) : Icon ? (
                      <span
                        className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        <Icon className="h-7 w-7" />
                      </span>
                    ) : null}
                    <p className="line-clamp-2 w-full text-center text-xs font-semibold leading-snug text-primary">
                      {primaryEvent.title}
                    </p>
                    {category ? (
                      <span
                        className="max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {EVENT_CATEGORIES[category].label}
                      </span>
                    ) : null}
                    {overflow > 0 ? (
                      <span className="text-xs font-semibold text-primary/60">+{overflow} more</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-[6.75rem] w-full items-center justify-center rounded-xl border border-dashed border-silver/40 bg-silver/5">
                    <span className="text-xs font-medium text-silver-foreground">No events</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
