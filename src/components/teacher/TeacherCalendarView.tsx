"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react"
import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TEACHER_BG, TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import {
  formatDateKey,
  formatMonthYear,
  getAccentHex,
} from "@/lib/calendar"

export function TeacherCalendarView() {
  const { calendarEvents, calendarSettings } = useDemo()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [view, setView] = useState<"day" | "week" | "month">("month")

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
    <div className="space-y-6 p-6" style={{ backgroundColor: TEACHER_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Lunch Calendar
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Read-only published menu calendar from admin
        </p>
      </div>

      <Card
        className="rounded-2xl border p-4 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: TEACHER_NAVY }}
          >
            Published
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PNG
            </Button>
          </div>
        </div>
        <p className="mt-3 text-sm text-silver-foreground">
          Download, export, and print are available on this calendar page only.
        </p>
      </Card>

      <Card
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="px-8 py-6 text-white" style={{ backgroundColor: accentHex }}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            {calendarSettings.schoolName}
          </p>
          <h2 className="mt-1 text-2xl font-bold">{calendarSettings.headerTitle}</h2>
          {calendarSettings.bannerMessage ? (
            <div className="mt-4 rounded-2xl bg-white/15 px-5 py-3">
              <p className="text-sm">{calendarSettings.bannerMessage}</p>
            </div>
          ) : null}
        </div>

        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            {formatMonthYear(year, month)}
          </h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
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
      </Card>

      {selectedDate ? (
        <Card
          className="rounded-2xl border p-6 shadow-sm"
          style={{ borderColor: TEACHER_SILVER }}
        >
          <h3 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            {view === "day" ? "Day" : "Selected Date"} —{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="mt-3 text-sm text-silver-foreground">No lunch events on this date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {selectedEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-2xl border px-4 py-3"
                  style={{ borderColor: TEACHER_SILVER }}
                >
                  <p className="font-semibold" style={{ color: TEACHER_NAVY }}>
                    {event.title}
                  </p>
                  {event.description ? (
                    <p className="mt-1 text-sm text-silver-foreground">{event.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  )
}
