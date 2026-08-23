"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { CATEGORY_ICONS, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { MenuDayDetails } from "@/components/calendar/MenuDayDetails"
import { ResponsiveCalendar } from "@/components/calendar/ResponsiveCalendar"
import { OrderLunchAction } from "@/components/parent/OrderLunchAction"
import { useDemo } from "@/components/providers/DemoProvider"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { useParentLunchReservations } from "@/hooks/useParentLunchReservations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/input"
import {
  EVENT_CATEGORIES,
  formatDateKey,
  formatMonthYear,
  getAccentHex,
  getEventColor,
} from "@/lib/calendar"
import { getEventCoverPhoto } from "@/components/calendar/calendar-event-media"
import { filterPublicCalendarEvents } from "@/lib/calendar-publish"
import {
  formatReservationConfirmation,
  formatReservationDetailLine,
  groupReservationsByDate,
  isActiveReservation,
  reservationColorForStudent,
  type ParentLunchReservation,
} from "@/lib/parent-lunch-reservations"
import type { CalendarDayReservationMark } from "@/components/calendar/CalendarMonthGrid"

export function ParentCalendarView() {
  const { calendarEvents, calendarSettings, mealTemplates } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()
  const { reservations, reload: reloadReservations } = useParentLunchReservations()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [childFilter, setChildFilter] = useState<string>("all")

  const accentHex = getAccentHex(calendarSettings.accentColor)

  const mealTemplatesById = useMemo(
    () => new Map(mealTemplates.map((t) => [t.id, t])),
    [mealTemplates]
  )

  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])

  const activeReservations = useMemo(
    () =>
      reservations.filter((row) => {
        if (!isActiveReservation(row)) return false
        if (childFilter === "all") return true
        return row.studentId === childFilter
      }),
    [reservations, childFilter]
  )

  const reservationsByDate = useMemo(() => {
    const grouped = groupReservationsByDate(activeReservations)
    const marks = new Map<string, CalendarDayReservationMark[]>()
    for (const [date, rows] of grouped) {
      const byStudent = new Map<string, ParentLunchReservation>()
      for (const row of rows) {
        if (!byStudent.has(row.studentId)) byStudent.set(row.studentId, row)
      }
      marks.set(
        date,
        [...byStudent.values()].map((row) => ({
          studentId: row.studentId,
          studentName: row.studentName,
          color: reservationColorForStudent(row.studentId),
          label: formatReservationDetailLine(row),
        }))
      )
    }
    return marks
  }, [activeReservations])

  const selectedDayReservations = useMemo(() => {
    if (!selectedDate) return []
    return activeReservations.filter((r) => r.date === selectedDate)
  }, [activeReservations, selectedDate])

  const monthEvents = useMemo(
    () =>
      publicEvents
        .filter((e) => {
          const d = new Date(e.date + "T12:00:00")
          return d.getFullYear() === year && d.getMonth() === month
        })
        .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title)),
    [publicEvents, year, month]
  )

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    return publicEvents
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [publicEvents, selectedDate])

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
        <h1 className="mt-1 text-2xl font-bold text-primary">Meal Calendar</h1>
        <p className="text-silver-foreground">
          Full published lunches (main, sides, desserts, fruits) and your reserved days for{" "}
          {calendarSettings.schoolName}
        </p>
      </header>

      <div className="space-y-6 p-4 sm:p-6 md:p-8">
        {linkedStudents.length > 1 ? (
          <Card className="rounded-[20px] border-silver/60 p-4 shadow-sm sm:p-5">
            <Label htmlFor="parent-calendar-child-filter">Show reservations for</Label>
            <Select
              id="parent-calendar-child-filter"
              className="mt-1 max-w-sm"
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
            >
              <option value="all">All linked children</option>
              {linkedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs text-silver-foreground">
              Calendar marks only show meals you reserved for your linked students.
            </p>
          </Card>
        ) : null}

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
            <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 sm:mb-6 md:flex">
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

            <ResponsiveCalendar
              year={year}
              month={month}
              onYearMonthChange={(y, m) => {
                setYear(y)
                setMonth(m)
              }}
              events={publicEvents}
              accentHex={accentHex}
              selectedDate={selectedDate}
              onDayClick={setSelectedDate}
              readOnly
              mealTemplatesById={mealTemplatesById}
              reservationsByDate={reservationsByDate}
            />

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <CategoryLegend />
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <span
                  className="inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: "#00A83E" }}
                >
                  ✓ Reserved
                </span>
                Your lunch orders
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {selectedDate ? (
            <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-bold text-primary">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>

              {selectedDayReservations.length > 0 ? (
                <div className="mb-5 space-y-2 rounded-2xl border border-[#00A83E]/25 bg-[#00A83E]/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-[#00A83E]" aria-hidden />
                    Reserved for this day
                  </p>
                  <ul className="space-y-2">
                    {selectedDayReservations.map((row) => (
                      <li key={row.id} className="text-sm text-silver-foreground">
                        <p className="font-semibold text-primary">
                          {formatReservationConfirmation({
                            studentName: row.studentName,
                            date: row.date,
                            mealType: row.mealType,
                            sliceCount: row.sliceCount,
                            totalAmount: row.totalAmount,
                            price: row.price,
                          })}
                        </p>
                        <p className="mt-0.5 text-xs">{formatReservationDetailLine(row)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedEvents.length === 0 ? (
                <p className="text-sm text-silver-foreground">No published events on this day.</p>
              ) : (
                <div className="space-y-5">
                  {selectedEvents.map((event) => {
                    const Icon = CATEGORY_ICONS[event.category]
                    const color = getEventColor(event)
                    const cat = EVENT_CATEGORIES[event.category]
                    const cover = getEventCoverPhoto(event, mealTemplatesById)
                    return (
                      <div
                        key={event.id}
                        className="rounded-2xl border border-silver/40 p-4"
                        style={{ borderLeftWidth: 4, borderLeftColor: color }}
                      >
                        <div className="mb-3 flex items-center gap-3">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cover}
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${color}18`, color }}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                          )}
                          <div>
                            <p className="font-bold text-primary">{event.title}</p>
                            <p
                              className="text-xs font-semibold uppercase tracking-wide"
                              style={{ color }}
                            >
                              {cat.label}
                            </p>
                          </div>
                        </div>

                        {event.category === "menu_day" ? (
                          <MenuDayDetails
                            event={event}
                            mealTemplatesById={mealTemplatesById}
                            compact
                          >
                            <OrderLunchAction
                              date={event.date}
                              menuTitle={event.title}
                              enabled
                              onReserved={() => void reloadReservations()}
                            />
                          </MenuDayDetails>
                        ) : event.description ? (
                          <p className="text-sm leading-relaxed text-silver-foreground">
                            {event.description}
                          </p>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          ) : null}

          <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-primary">This Month</h3>
            {monthEvents.length === 0 ? (
              <p className="text-sm text-silver-foreground">No events scheduled this month.</p>
            ) : (
              <ul className="space-y-3">
                {monthEvents.map((event) => {
                  const Icon = CATEGORY_ICONS[event.category]
                  const color = getEventColor(event)
                  const dayMarks = reservationsByDate.get(event.date) ?? []
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
                            {dayMarks.length > 0
                              ? ` · Reserved${
                                  dayMarks.length === 1
                                    ? ` · ${dayMarks[0]!.studentName.trim().split(/\s+/)[0]}`
                                    : ` · ${dayMarks.length} children`
                                }`
                              : ""}
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
