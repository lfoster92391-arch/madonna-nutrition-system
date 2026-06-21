"use client"

import { useMemo } from "react"
import Image from "next/image"
import {
  CATEGORY_ICONS,
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
import { cn } from "@/lib/utils"

interface CalendarWeekOutlookProps {
  weekStart: Date
  events: CalendarEvent[]
  accentHex: string
  selectedDate?: string | null
  onDayClick?: (dateKey: string) => void
  readOnly?: boolean
  mealTemplatesById?: Map<string, MealTemplate>
}

export function CalendarWeekOutlook({
  weekStart,
  events,
  accentHex,
  selectedDate,
  onDayClick,
  readOnly = false,
  mealTemplatesById,
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
    <div className="overflow-hidden rounded-[20px] border border-silver/60 bg-white">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2 p-2">
          {weekDates.map((date) => {
            const dateKey = formatDateKey(date)
            const dayEvents = eventsByDate.get(dateKey) ?? []
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

            return (
              <button
                key={dateKey}
                type="button"
                disabled={readOnly && !onDayClick}
                onClick={() => onDayClick?.(dateKey)}
                aria-pressed={isSelected}
                aria-label={date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                className={cn(
                  "flex w-[5.75rem] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-silver/50 bg-white p-2 text-left transition",
                  readOnly ? "cursor-default" : "cursor-pointer hover:border-primary/30 hover:bg-primary/5",
                  isSelected && "border-primary/40 bg-primary/5 ring-2 ring-inset ring-primary/25",
                  isToday && !isSelected && "border-primary/20 bg-success/5"
                )}
                style={isSelected ? { boxShadow: `inset 0 0 0 1px ${accentHex}` } : undefined}
              >
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary/60">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      isToday ? "text-white" : "text-primary"
                    )}
                    style={isToday ? { backgroundColor: accentHex } : undefined}
                  >
                    {date.getDate()}
                  </p>
                </div>

                {primaryEvent ? (
                  <div className="flex w-full flex-col items-center gap-1">
                    {cover ? (
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-silver/40 shadow-sm">
                        <Image
                          src={cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized={cover.startsWith("/uploads/") || cover.startsWith("blob:")}
                        />
                      </span>
                    ) : Icon ? (
                      <span
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        <Icon className="h-6 w-6" />
                      </span>
                    ) : null}
                    <p className="line-clamp-2 w-full text-center text-[10px] font-semibold leading-tight text-primary">
                      {primaryEvent.title}
                    </p>
                    {category ? (
                      <span
                        className="max-w-full truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {EVENT_CATEGORIES[category].label}
                      </span>
                    ) : null}
                    {overflow > 0 ? (
                      <span className="text-[10px] font-semibold text-primary/60">+{overflow} more</span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-[5.5rem] w-full items-center justify-center rounded-xl border border-dashed border-silver/40 bg-silver/5">
                    <span className="text-[10px] font-medium text-silver-foreground">No events</span>
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
