"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import {
  formatDateKey,
  formatMonthYear,
  getAccentHex,
} from "@/lib/calendar"

export function TeacherCalendarPreview() {
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

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            Published Lunch Calendar
          </h2>
          <p className="text-sm text-silver-foreground">
            Read-only preview from the admin calendar
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: TEACHER_NAVY }}
        >
          Published
        </span>
      </div>

      <Card
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="px-6 py-4 text-white" style={{ backgroundColor: accentHex }}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            {calendarSettings.schoolName}
          </p>
          <h3 className="mt-1 text-lg font-bold">{calendarSettings.headerTitle}</h3>
        </div>

        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-bold" style={{ color: TEACHER_NAVY }}>
            {formatMonthYear(year, month)}
          </p>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 sm:p-4">
          <CategoryLegend />
          <CalendarMonthGrid
            year={year}
            month={month}
            events={monthEvents}
            accentHex={accentHex}
            selectedDate={selectedDate}
            onDayClick={setSelectedDate}
            readOnly
          />
        </div>

        <div
          className="flex justify-end border-t px-4 py-4"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <Button asChild>
            <Link href="/teacher/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Open Calendar
            </Link>
          </Button>
        </div>
      </Card>
    </section>
  )
}
