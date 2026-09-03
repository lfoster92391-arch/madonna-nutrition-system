"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import {
  CATEGORY_ICONS,
  CategoryLegend,
  type CalendarDayReservationMark,
} from "@/components/calendar/CalendarMonthGrid"
import { MenuDayDetails } from "@/components/calendar/MenuDayDetails"
import { ResponsiveCalendar } from "@/components/calendar/ResponsiveCalendar"
import { getEventCoverPhoto } from "@/components/calendar/calendar-event-media"
import { madonnaOptionBtn } from "@/components/nav/madonna-option-classes"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import {
  EVENT_CATEGORIES,
  formatDateKey,
  formatMonthYear,
  getAccentHex,
  getEventColor,
} from "@/lib/calendar"
import { filterPublicCalendarEvents } from "@/lib/calendar-publish"
import {
  formatReservationDetailLine,
  groupReservationsByDate,
  isActiveReservation,
  reservationColorForStudent,
  type ParentLunchReservation,
} from "@/lib/parent-lunch-reservations"
import { cn, formatCurrency } from "@/lib/utils"

export function StudentCalendarView() {
  const { user } = useAuth()
  const { calendarEvents, calendarSettings, mealTemplates, databaseEnabled } = useDemo()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(formatDateKey(now))
  const [reservations, setReservations] = useState<ParentLunchReservation[]>([])

  const accentHex = getAccentHex(calendarSettings.accentColor)

  const mealTemplatesById = useMemo(
    () => new Map(mealTemplates.map((t) => [t.id, t])),
    [mealTemplates]
  )

  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])

  const loadReservations = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setReservations([])
      return
    }
    const res = await fetch("/api/lunch-reservations", {
      headers: { "x-session-user-id": user.id },
    })
    if (res.ok) {
      const data = (await res.json()) as { reservations?: ParentLunchReservation[] }
      setReservations(data.reservations ?? [])
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  const activeReservations = useMemo(
    () => reservations.filter((row) => isActiveReservation(row)),
    [reservations]
  )

  const reservationsByDate = useMemo(() => {
    const grouped = groupReservationsByDate(activeReservations)
    const marks = new Map<string, CalendarDayReservationMark[]>()
    for (const [date, rows] of grouped) {
      marks.set(
        date,
        rows.slice(0, 1).map((row) => ({
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
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#041B52]">Lunch calendar</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Browse the month’s published lunches and sign up for future school days.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#C8CDD7] bg-white">
        <div className="px-4 py-5 text-white sm:px-6" style={{ backgroundColor: accentHex }}>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            {calendarSettings.schoolName}
          </p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">{calendarSettings.headerTitle}</h2>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[#041B52]">{formatMonthYear(year, month)}</h3>
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
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#041B52]">
              <span className="inline-flex h-6 items-center rounded-md bg-[#00A83E] px-2 text-[10px] font-bold uppercase tracking-wide text-white">
                ✓ Reserved
              </span>
              Your lunch orders
            </div>
          </div>
        </div>
      </section>

      {selectedDate ? (
        <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
          <h3 className="text-lg font-bold text-[#041B52]">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>

          {selectedDayReservations.length > 0 ? (
            <div className="mt-4 space-y-2 rounded-2xl border border-[#00A83E]/25 bg-[#00A83E]/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-[#041B52]">
                <CheckCircle2 className="h-4 w-4 text-[#00A83E]" aria-hidden />
                Already ordered
              </p>
              <ul className="space-y-1">
                {selectedDayReservations.map((row) => (
                  <li key={row.id} className="text-sm text-[#64748B]">
                    {row.mealType.replace(/_/g, " ")}
                    {row.sliceCount
                      ? ` · ${row.sliceCount} ${row.sliceCount === 1 ? "slice" : "slices"}`
                      : ""}{" "}
                    · {formatCurrency(row.totalAmount ?? row.price)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selectedEvents.length === 0 ? (
            <p className="mt-4 text-sm text-[#64748B]">No published lunch on this day.</p>
          ) : (
            <div className="mt-4 space-y-5">
              {selectedEvents.map((event) => {
                const Icon = CATEGORY_ICONS[event.category]
                const color = getEventColor(event)
                const cat = EVENT_CATEGORIES[event.category]
                const cover = getEventCoverPhoto(event, mealTemplatesById)
                return (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-[#E2E8F0] p-4"
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
                        <p className="font-bold text-[#041B52]">{event.title}</p>
                        <p
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color }}
                        >
                          {cat.label}
                        </p>
                      </div>
                    </div>

                    {event.category === "menu_day" ? (
                      <MenuDayDetails event={event} mealTemplatesById={mealTemplatesById} compact>
                        <Link
                          href={`/student/order?date=${encodeURIComponent(event.date)}`}
                          className={cn(
                            madonnaOptionBtn({ shape: "rounded" }),
                            "mt-4 inline-flex w-full items-center justify-center px-4 py-3 text-sm font-bold sm:w-auto"
                          )}
                        >
                          Order lunch for this day
                        </Link>
                      </MenuDayDetails>
                    ) : event.description ? (
                      <p className="text-sm leading-relaxed text-[#64748B]">{event.description}</p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-[#041B52]">This month</h3>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-[#64748B]">No events scheduled this month.</p>
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
                    className="flex w-full items-center gap-3 rounded-2xl border border-[#E2E8F0] p-3 text-left transition hover:border-[#041B52]/20 hover:bg-[#041B52]/5"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#041B52]">{event.title}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {dayMarks.length > 0 ? " · Reserved" : ""}
                      </p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Link
        href="/student/order"
        className={cn(
          madonnaOptionBtn({ shape: "rounded" }),
          "flex w-full items-center justify-center px-4 py-3 text-sm font-bold"
        )}
      >
        Back to today’s lunch
      </Link>
    </div>
  )
}
