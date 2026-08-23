"use client"

import { useMemo, type KeyboardEvent } from "react"
import Image from "next/image"
import {
  Ban,
  Clock,
  Sparkles,
  Star,
  UtensilsCrossed,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import {
  ADMIN_LEGEND_CATEGORIES,
  EVENT_CATEGORIES,
  WEEKDAYS,
  formatDateKey,
  getEventColor,
  getMonthGrid,
  groupEventsByDate,
} from "@/lib/calendar"
import { getEventCoverPhoto } from "@/components/calendar/calendar-event-media"
import type { CalendarEvent, CalendarEventCategory, MealTemplate } from "@/lib/types"
import { isLocalMealPhotoUrl } from "@/lib/meal-templates"
import { cn } from "@/lib/utils"

export const CATEGORY_ICONS: Record<CalendarEventCategory, LucideIcon> = {
  menu_day: UtensilsCrossed,
  holiday: Star,
  early_dismissal: Clock,
  special_event: Sparkles,
  no_school: Ban,
  teacher_meal: UserRound,
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const

/** Parent portal: reserved lunches for a calendar day (linked children only). */
export type CalendarDayReservationMark = {
  studentId: string
  studentName: string
  color: string
  label?: string
}

interface CalendarMonthGridProps {
  year: number
  month: number
  events: CalendarEvent[]
  accentHex: string
  selectedDate?: string | null
  onDayClick?: (dateKey: string) => void
  /** When set (admin), clicking a menu/event chip selects that event for Edit/Delete */
  onEventClick?: (event: CalendarEvent) => void
  selectedEventId?: string | null
  readOnly?: boolean
  /** When provided, menu_day events show cover photos from linked templates */
  mealTemplatesById?: Map<string, MealTemplate>
  /** Mobile dot grid: show, or hide when a parent renders week outlook separately */
  mobileLayout?: "dots" | "hidden"
  /** Optional reservation marks keyed by YYYY-MM-DD */
  reservationsByDate?: Map<string, CalendarDayReservationMark[]>
}

function dayButtonClassName({
  readOnly,
  isCurrentMonth,
  isSelected,
  isToday,
  mobile = false,
}: {
  readOnly: boolean
  isCurrentMonth: boolean
  isSelected: boolean
  isToday: boolean
  mobile?: boolean
}) {
  return cn(
    "text-left transition",
    mobile
      ? "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-start gap-1 rounded-xl p-1.5"
      : "min-h-[110px] p-2",
    readOnly ? "cursor-default" : "cursor-pointer hover:bg-primary/5",
    !isCurrentMonth && "opacity-40",
    isSelected && "bg-primary/10 ring-2 ring-inset ring-primary/40",
    isToday && !isSelected && "bg-success/5"
  )
}

function EventDots({ events, max = 3 }: { events: CalendarEvent[]; max?: number }) {
  if (events.length === 0) return <span className="h-1.5" aria-hidden />
  const shown = events.slice(0, max)
  const overflow = events.length - max
  return (
    <div className="flex flex-wrap items-center justify-center gap-1" aria-hidden>
      {shown.map((event) => (
        <span
          key={event.id}
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: getEventColor(event) }}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[11px] font-semibold leading-none text-primary/70">+{overflow}</span>
      )}
    </div>
  )
}

function ReservationMarks({
  marks,
  compact = false,
}: {
  marks: CalendarDayReservationMark[]
  compact?: boolean
}) {
  if (marks.length === 0) return null
  const first = marks[0]!
  const firstName = first.studentName.trim().split(/\s+/)[0] || first.studentName
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-0.5" aria-hidden>
        {marks.slice(0, 3).map((mark) => (
          <span
            key={`${mark.studentId}-${mark.color}`}
            className="h-1.5 w-1.5 rounded-full ring-1 ring-white"
            style={{ backgroundColor: mark.color }}
            title={`Reserved for ${mark.studentName}`}
          />
        ))}
      </div>
    )
  }
  return (
    <div
      className="mt-0.5 flex items-center gap-1 truncate rounded-md px-1 py-0.5 text-[10px] font-bold leading-tight text-white"
      style={{ backgroundColor: first.color }}
      title={marks.map((m) => `Reserved for ${m.studentName}`).join(", ")}
    >
      <span aria-hidden>✓</span>
      <span className="truncate">
        {marks.length === 1 ? `Reserved · ${firstName}` : `Reserved · ${marks.length}`}
      </span>
    </div>
  )
}

export function CalendarMonthGrid({
  year,
  month,
  events,
  accentHex,
  selectedDate,
  onDayClick,
  onEventClick,
  selectedEventId,
  readOnly = false,
  mealTemplatesById,
  mobileLayout = "dots",
  reservationsByDate,
}: CalendarMonthGridProps) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month])
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  const todayKey = formatDateKey(new Date())
  const eventChipsInteractive = Boolean(onEventClick) && !readOnly

  function handleDayKeyDown(dateKey: string, e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onDayClick?.(dateKey)
    }
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-silver/60 bg-white">
      {/* Mobile: compact dot calendar — optional secondary view on small screens */}
      {mobileLayout === "dots" ? (
      <div className="md:hidden">
        <div className="grid grid-cols-7 border-b border-silver/60 bg-silver/10">
          {WEEKDAY_INITIALS.map((day, i) => (
            <div
              key={`${day}-${i}`}
              className="px-1 py-2.5 text-center text-sm font-bold uppercase text-primary/70"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y divide-silver/40 p-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5 py-0.5">
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} className="min-h-[3.25rem]" aria-hidden />
                }
                const dateKey = formatDateKey(date)
                const dayEvents = eventsByDate.get(dateKey) ?? []
                const dayReservations = reservationsByDate?.get(dateKey) ?? []
                const isToday = dateKey === todayKey
                const isSelected = selectedDate === dateKey
                const isCurrentMonth = date.getMonth() === month
                const eventCount = dayEvents.length
                const disabled = readOnly && !onDayClick
                const reservedSuffix =
                  dayReservations.length > 0
                    ? `, ${dayReservations.length} reserved lunch${dayReservations.length === 1 ? "" : "es"}`
                    : ""

                return (
                  <button
                    key={di}
                    type="button"
                    disabled={disabled}
                    onClick={() => onDayClick?.(dateKey)}
                    aria-label={
                      eventCount > 0
                        ? `${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, ${eventCount} event${eventCount === 1 ? "" : "s"}${reservedSuffix}`
                        : `${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${reservedSuffix}`
                    }
                    aria-pressed={isSelected}
                    className={dayButtonClassName({
                      readOnly,
                      isCurrentMonth,
                      isSelected,
                      isToday,
                      mobile: true,
                    })}
                    style={isSelected ? { boxShadow: `inset 0 0 0 2px ${accentHex}` } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        isToday ? "text-white" : "text-primary"
                      )}
                      style={isToday ? { backgroundColor: accentHex } : undefined}
                    >
                      {date.getDate()}
                    </span>
                    {dayReservations.length > 0 ? (
                      <ReservationMarks marks={dayReservations} compact />
                    ) : (
                      <EventDots events={dayEvents} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      ) : null}

      {/* Desktop: full month grid with event previews */}
      <div className={mobileLayout === "hidden" ? "block" : "hidden md:block"}>
        <div className="grid grid-cols-7 border-b border-silver/60 bg-silver/10">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-primary/70"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y divide-silver/40">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 divide-x divide-silver/40">
              {week.map((date, di) => {
                if (!date) {
                  return <div key={di} className="min-h-[110px] bg-silver/5" />
                }
                const dateKey = formatDateKey(date)
                const dayEvents = eventsByDate.get(dateKey) ?? []
                const dayReservations = reservationsByDate?.get(dateKey) ?? []
                const isToday = dateKey === todayKey
                const isSelected = selectedDate === dateKey
                const isCurrentMonth = date.getMonth() === month
                const disabled = readOnly && !onDayClick
                // Nested event buttons require a non-button day cell
                const DayTag = eventChipsInteractive ? "div" : "button"

                return (
                  <DayTag
                    key={di}
                    {...(eventChipsInteractive
                      ? {
                          role: "button" as const,
                          tabIndex: disabled ? -1 : 0,
                          "aria-disabled": disabled || undefined,
                          onKeyDown: disabled
                            ? undefined
                            : (e: KeyboardEvent) => handleDayKeyDown(dateKey, e),
                        }
                      : {
                          type: "button" as const,
                          disabled,
                        })}
                    onClick={disabled ? undefined : () => onDayClick?.(dateKey)}
                    aria-pressed={isSelected}
                    className={dayButtonClassName({
                      readOnly,
                      isCurrentMonth,
                      isSelected,
                      isToday,
                    })}
                    style={isSelected ? { boxShadow: `inset 0 0 0 2px ${accentHex}` } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                        isToday ? "text-white" : "text-primary"
                      )}
                      style={isToday ? { backgroundColor: accentHex } : undefined}
                    >
                      {date.getDate()}
                    </span>
                    {dayReservations.length > 0 ? (
                      <ReservationMarks marks={dayReservations} />
                    ) : null}
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, readOnly ? 3 : 2).map((event) => {
                        const Icon = CATEGORY_ICONS[event.category]
                        const color = getEventColor(event)
                        const cover = getEventCoverPhoto(event, mealTemplatesById)
                        const isEventSelected = selectedEventId === event.id
                        const chipClass = cn(
                          "flex w-full items-center gap-1 truncate rounded-lg px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition",
                          eventChipsInteractive && "hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          isEventSelected && "ring-2 ring-primary"
                        )
                        const chipStyle = {
                          backgroundColor: `${color}18`,
                          color,
                        } as const
                        const chipInner = (
                          <>
                            {cover ? (
                              <span className="relative h-4 w-4 shrink-0 overflow-hidden rounded">
                                <Image
                                  src={cover}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="16px"
                                  unoptimized={isLocalMealPhotoUrl(cover)}
                                />
                              </span>
                            ) : (
                              <Icon className="h-3 w-3 shrink-0" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </>
                        )

                        if (eventChipsInteractive) {
                          return (
                            <button
                              key={event.id}
                              type="button"
                              className={chipClass}
                              style={chipStyle}
                              title={`${event.title} — Edit or Delete`}
                              aria-label={`${event.title}, open Edit or Delete`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onEventClick?.(event)
                              }}
                            >
                              {chipInner}
                            </button>
                          )
                        }

                        return (
                          <div
                            key={event.id}
                            className={chipClass}
                            style={chipStyle}
                            title={event.title}
                          >
                            {chipInner}
                          </div>
                        )
                      })}
                      {dayEvents.length > (readOnly ? 3 : 2) && (
                        <p className="text-[10px] font-medium text-silver-foreground">
                          +{dayEvents.length - (readOnly ? 3 : 2)} more
                        </p>
                      )}
                    </div>
                  </DayTag>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CategoryLegend({
  compact = false,
  categories,
}: {
  compact?: boolean
  categories?: CalendarEventCategory[]
}) {
  const entries = (categories ?? Object.keys(EVENT_CATEGORIES)) as CalendarEventCategory[]
  return (
    <div className={cn("flex flex-wrap gap-3", compact && "gap-2")}>
      {entries.map((key) => {
        const cat = EVENT_CATEGORIES[key]
        const Icon = CATEGORY_ICONS[key]
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className={cn("font-medium text-primary text-sm", !compact && "md:text-sm")}>
              {cat.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { ADMIN_LEGEND_CATEGORIES }
