"use client"

import { useMemo } from "react"
import {
  Ban,
  Clock,
  Sparkles,
  Star,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"
import {
  EVENT_CATEGORIES,
  WEEKDAYS,
  formatDateKey,
  getEventColor,
  getMonthGrid,
  groupEventsByDate,
} from "@/lib/calendar"
import type { CalendarEvent, CalendarEventCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

export const CATEGORY_ICONS: Record<CalendarEventCategory, LucideIcon> = {
  menu_day: UtensilsCrossed,
  holiday: Star,
  early_dismissal: Clock,
  special_event: Sparkles,
  no_school: Ban,
}

interface CalendarMonthGridProps {
  year: number
  month: number
  events: CalendarEvent[]
  accentHex: string
  selectedDate?: string | null
  onDayClick?: (dateKey: string) => void
  readOnly?: boolean
}

export function CalendarMonthGrid({
  year,
  month,
  events,
  accentHex,
  selectedDate,
  onDayClick,
  readOnly = false,
}: CalendarMonthGridProps) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month])
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  const todayKey = formatDateKey(new Date())

  return (
    <div className="overflow-hidden rounded-[20px] border border-silver/60 bg-white">
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
              const isToday = dateKey === todayKey
              const isSelected = selectedDate === dateKey
              const isCurrentMonth = date.getMonth() === month

              return (
                <button
                  key={di}
                  type="button"
                  disabled={readOnly && !onDayClick}
                  onClick={() => onDayClick?.(dateKey)}
                  className={cn(
                    "min-h-[110px] p-2 text-left transition",
                    readOnly ? "cursor-default" : "cursor-pointer hover:bg-primary/5",
                    !isCurrentMonth && "opacity-40",
                    isSelected && "bg-primary/8 ring-2 ring-inset",
                    isToday && !isSelected && "bg-success/5"
                  )}
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
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, readOnly ? 3 : 2).map((event) => {
                      const Icon = CATEGORY_ICONS[event.category]
                      const color = getEventColor(event)
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-1 truncate rounded-lg px-1.5 py-0.5 text-[10px] font-semibold leading-tight"
                          style={{ backgroundColor: `${color}18`, color }}
                          title={event.title}
                        >
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.title}</span>
                        </div>
                      )
                    })}
                    {dayEvents.length > (readOnly ? 3 : 2) && (
                      <p className="text-[10px] font-medium text-silver-foreground">
                        +{dayEvents.length - (readOnly ? 3 : 2)} more
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CategoryLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex flex-wrap gap-3", compact && "gap-2")}>
      {(Object.entries(EVENT_CATEGORIES) as [CalendarEventCategory, typeof EVENT_CATEGORIES.menu_day][]).map(
        ([key, cat]) => {
          const Icon = CATEGORY_ICONS[key]
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className={cn("font-medium text-primary", compact ? "text-xs" : "text-sm")}>
                {cat.label}
              </span>
            </div>
          )
        }
      )}
    </div>
  )
}
