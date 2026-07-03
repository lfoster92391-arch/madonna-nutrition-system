"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { formatDateKey, formatMonthYear, getAccentHex } from "@/lib/calendar"

export function StaffCalendarPreview() {
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

  const selectedEvents = selectedDate
    ? monthEvents.filter((e) => e.date === selectedDate)
    : []

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <Calendar className="h-5 w-5" />
          Lunch Calendar
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/staff/calendar">Full Calendar</Link>
        </Button>
      </div>
      <Card
        className="rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={prevMonth}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border transition hover:bg-[#0A1E3F]/5"
            style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold" style={{ color: STAFF_NAVY }}>
            {formatMonthYear(year, month)}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-2xl border transition hover:bg-[#0A1E3F]/5"
            style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <CalendarMonthGrid
          year={year}
          month={month}
          events={monthEvents}
          selectedDate={selectedDate}
          onDayClick={setSelectedDate}
          accentHex={accentHex}
        />
        <div className="mt-4">
          <CategoryLegend />
        </div>
        {selectedEvents.length > 0 ? (
          <div className="mt-4 border-t pt-4" style={{ borderColor: STAFF_SILVER }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Selected day"}
            </p>
            <ul className="mt-2 space-y-2">
              {selectedEvents.map((event) => (
                <li key={event.id} className="text-sm" style={{ color: STAFF_NAVY }}>
                  {event.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
    </section>
  )
}
