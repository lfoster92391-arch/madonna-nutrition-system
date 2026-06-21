"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarMonthGrid, CATEGORY_ICONS, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  EVENT_CATEGORIES,
  formatDateKey,
  formatMonthYear,
  getAccentHex,
  getEventColor,
} from "@/lib/calendar"

export function ParentCalendarView() {
  const { calendarEvents, calendarSettings } = useDemo()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))

  const accentHex = getAccentHex(calendarSettings.accentColor)

  const monthEvents = useMemo(
    () =>
      calendarEvents
        .filter((e) => {
          const d = new Date(e.date + "T12:00:00")
          return d.getFullYear() === year && d.getMonth() === month
        })
        .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [calendarEvents, year, month]
  )

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return calendarEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [calendarEvents, selectedDate])

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else {
      setMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="border-b border-silver/40 bg-white px-4 py-5 sm:px-6 md:px-8 md:py-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Parent Portal</p>
        <h1 className="mt-1 text-2xl font-bold text-primary">School Calendar</h1>
        <p className="text-silver-foreground">
          Lunch menus, holidays, and important dates from {calendarSettings.schoolName}
        </p>
      </header>

      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        <Card className="overflow-hidden rounded-[20px] border-silver/60 shadow-sm">
          <div className="px-4 py-5 text-white sm:px-6 sm:py-6 md:px-8" style={{ backgroundColor: accentHex }}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">
              {calendarSettings.schoolName}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{calendarSettings.headerTitle}</h2>
            {calendarSettings.bannerMessage && (
              <div className="mt-4 rounded-2xl bg-white/15 px-5 py-3">
                <p className="text-sm font-semibold">{calendarSettings.bannerMessage}</p>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
              <h3 className="text-lg font-bold text-primary sm:text-xl">{formatMonthYear(year, month)}</h3>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setYear(now.getFullYear())
                    setMonth(now.getMonth())
                    setSelectedDate(formatDateKey(now))
                  }}
                >
                  Today
                </Button>
                <Button size="sm" variant="outline" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CalendarMonthGrid
              year={year}
              month={month}
              events={calendarEvents}
              accentHex={accentHex}
              selectedDate={selectedDate}
              onDayClick={setSelectedDate}
              readOnly
            />

            <div className="mt-6">
              <CategoryLegend />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {selectedDate && selectedEvents.length > 0 && (
            <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-primary">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="space-y-4">
                {selectedEvents.map((event) => {
                  const Icon = CATEGORY_ICONS[event.category]
                  const color = getEventColor(event)
                  const cat = EVENT_CATEGORIES[event.category]
                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-silver/40 p-4"
                      style={{ borderLeftWidth: 4, borderLeftColor: color }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-bold text-primary">{event.title}</p>
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>
                            {cat.label}
                          </p>
                        </div>
                      </div>
                      {event.description && (
                        <p className="mt-3 text-sm leading-relaxed text-silver-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-primary">This Month</h3>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-silver-foreground">No events scheduled this month.</p>
            ) : (
              <ul className="space-y-3">
                {monthEvents.map((event) => {
                  const Icon = CATEGORY_ICONS[event.category]
                  const color = getEventColor(event)
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(event.date)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-silver/30 p-3 text-left transition hover:border-primary/20 hover:bg-primary/5"
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-primary">{event.title}</p>
                          <p className="text-xs text-silver-foreground">
                            {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
