"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Search, UserRoundSearch } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input, Label } from "@/components/ui/input"
import { getSessionHeaders } from "@/lib/api/client"
import { filterPublicCalendarEvents, todayDateKey } from "@/lib/calendar-publish"
import { isSchoolLunchDateKey } from "@/lib/calendar"
import {
  DEFAULT_ONBOARDING_PRICING,
  MILK_JUICE_PRICE,
} from "@/config/onboarding-pricing"
import {
  DEFAULT_PIZZA_SLICES,
  isPizzaDayName,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import {
  formatReservationConfirmation,
  formatReservationDetailLine,
  formatReservationDateShort,
} from "@/lib/parent-lunch-reservations"
import { formatCurrency } from "@/lib/utils"

type MealType = "MAIN" | "SIDE" | "MILK"

const MEAL_OPTIONS: { value: MealType; label: string; defaultPrice: number }[] = [
  { value: "MAIN", label: "Main meal", defaultPrice: DEFAULT_ONBOARDING_PRICING.mainMealPrice },
  { value: "SIDE", label: "Side", defaultPrice: DEFAULT_ONBOARDING_PRICING.sideMealPrice },
  { value: "MILK", label: "Milk", defaultPrice: MILK_JUICE_PRICE },
]

type SearchStudent = {
  id: string
  firstName: string
  lastName: string
  photo: string
  grade: string
  homeroom: string | null
  disabled: boolean
  balance: number
}

type ReservationRow = {
  id: string
  studentId: string
  studentName: string
  date: string
  mealType: string
  price: number
  sliceCount?: number | null
  totalAmount?: number | null
  status: string
}

type DaySelection = {
  selected: boolean
  meals: Record<MealType, boolean>
  sliceCount: number
}

type WorkplaceStudentLunchSignupProps = {
  /** Portal label shown in the header, e.g. "Teacher" / "Staff" / "Admin". */
  portalLabel: string
  accentColor?: string
}

function emptyDaySelection(isPizza: boolean): DaySelection {
  return {
    selected: false,
    meals: { MAIN: true, SIDE: false, MILK: false },
    sliceCount: isPizza ? DEFAULT_PIZZA_SLICES : DEFAULT_PIZZA_SLICES,
  }
}

export function WorkplaceStudentLunchSignup({
  portalLabel,
  accentColor = "#041B52",
}: WorkplaceStudentLunchSignupProps) {
  const { user } = useAuth()
  const { calendarEvents, databaseEnabled } = useDemo()
  const today = todayDateKey()

  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchStudent[]>([])
  const [selected, setSelected] = useState<SearchStudent | null>(null)
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [daySelections, setDaySelections] = useState<Record<string, DaySelection>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])

  const menuDays = useMemo(() => {
    return publicEvents
      .filter(
        (e) =>
          e.category === "menu_day" && e.date >= today && isSchoolLunchDateKey(e.date)
      )
      .map((e) => ({ date: e.date, title: e.title }))
      .filter((row, index, arr) => arr.findIndex((r) => r.date === row.date) === index)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [publicEvents, today])

  useEffect(() => {
    setDaySelections((prev) => {
      const next = { ...prev }
      for (const day of menuDays) {
        if (!next[day.date]) {
          next[day.date] = emptyDaySelection(isPizzaDayName(day.title))
        }
      }
      return next
    })
  }, [menuDays])

  const loadReservations = useCallback(
    async (studentId: string) => {
      if (!databaseEnabled || !user) return
      const res = await fetch(
        `/api/workplace/student-lunch-reservations?studentId=${encodeURIComponent(studentId)}`,
        { headers: { ...getSessionHeaders() } }
      )
      if (!res.ok) return
      const data = (await res.json()) as { reservations?: ReservationRow[] }
      setReservations(data.reservations ?? [])
    },
    [databaseEnabled, user]
  )

  async function handleSearch() {
    setError(null)
    setMessage(null)
    if (!databaseEnabled || !user) {
      setError("Database is required to search students.")
      return
    }
    const q = query.trim()
    if (!q) {
      setError("Enter a student name or MD ID.")
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/workplace/students?q=${encodeURIComponent(q)}`, {
        headers: { ...getSessionHeaders() },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to search students")
        setResults([])
        return
      }
      setResults(data.students ?? [])
      if ((data.students ?? []).length === 0) {
        setError("No students matched that search.")
      }
    } catch {
      setError("Unable to search students. Try again.")
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  async function selectStudent(student: SearchStudent) {
    setSelected(student)
    setError(null)
    setMessage(null)
    setReservations([])
    if (student.disabled) {
      setError(
        "This student account is disabled. Re-enable them in Student Manager before signing them up for lunch."
      )
      return
    }
    await loadReservations(student.id)
  }

  function toggleDay(date: string) {
    setDaySelections((prev) => {
      const current = prev[date] ?? emptyDaySelection(false)
      return {
        ...prev,
        [date]: { ...current, selected: !current.selected },
      }
    })
  }

  function toggleMeal(date: string, meal: MealType) {
    setDaySelections((prev) => {
      const current = prev[date] ?? emptyDaySelection(false)
      return {
        ...prev,
        [date]: {
          ...current,
          selected: true,
          meals: { ...current.meals, [meal]: !current.meals[meal] },
        },
      }
    })
  }

  function setSlices(date: string, sliceCount: number) {
    setDaySelections((prev) => {
      const current = prev[date] ?? emptyDaySelection(true)
      return {
        ...prev,
        [date]: { ...current, selected: true, sliceCount },
      }
    })
  }

  const pendingItems = useMemo(() => {
    const items: {
      date: string
      mealType: MealType
      price: number
      sliceCount?: number
      menuTitle: string
    }[] = []

    for (const day of menuDays) {
      const sel = daySelections[day.date]
      if (!sel?.selected) continue
      const pizza = isPizzaDayName(day.title)
      for (const opt of MEAL_OPTIONS) {
        if (!sel.meals[opt.value]) continue
        const price =
          opt.value === "MAIN" && pizza
            ? pizzaSliceTotal(sel.sliceCount)
            : opt.defaultPrice
        items.push({
          date: day.date,
          mealType: opt.value,
          price,
          ...(opt.value === "MAIN" && pizza ? { sliceCount: sel.sliceCount } : {}),
          menuTitle: day.title,
        })
      }
    }
    return items
  }, [daySelections, menuDays])

  async function handleSave() {
    setError(null)
    setMessage(null)
    if (!selected || selected.disabled) {
      setError(
        selected?.disabled
          ? "This student account is disabled. Re-enable them before signing them up for lunch."
          : "Select a student first."
      )
      return
    }
    if (pendingItems.length === 0) {
      setError("Check at least one menu day and one meal item.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/workplace/student-lunch-reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(),
        },
        body: JSON.stringify({
          studentId: selected.id,
          items: pendingItems.map(({ date, mealType, price, sliceCount }) => ({
            date,
            mealType,
            price,
            ...(sliceCount != null ? { sliceCount } : {}),
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to save lunch signup")
        return
      }

      const first = pendingItems[0]!
      const confirmation = formatReservationConfirmation({
        studentName: `${selected.firstName} ${selected.lastName}`,
        date: first.date,
        mealType: first.mealType,
        menuTitle: first.menuTitle,
        sliceCount: first.sliceCount,
        totalAmount: first.price,
      })
      const extra =
        pendingItems.length > 1
          ? ` (+${pendingItems.length - 1} more item${pendingItems.length === 2 ? "" : "s"})`
          : ""
      setMessage(`${confirmation}${extra}. Kitchen counts and kiosk signup status are updated.`)

      setDaySelections((prev) => {
        const next = { ...prev }
        for (const item of pendingItems) {
          const day = next[item.date]
          if (!day) continue
          next[item.date] = {
            ...day,
            selected: false,
            meals: { MAIN: true, SIDE: false, MILK: false },
          }
        }
        return next
      })

      await loadReservations(selected.id)
    } catch {
      setError("Unable to save lunch signup. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const upcomingReservations = useMemo(
    () =>
      reservations.filter(
        (r) => r.date >= today && String(r.status).toUpperCase() === "RESERVED"
      ),
    [reservations, today]
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accentColor }}>
          {portalLabel}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: accentColor }}>
          Sign up a student for lunch
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Search any student, check published menu days and meal items, then save. Reservations
          count for the kitchen and clear the kiosk “no lunch signup” warning.
        </p>
      </div>

      <Card className="rounded-[20px] border-[#AEB6C2]/60 p-5 sm:p-6">
        <Label htmlFor="student-lunch-search">Search by MD ID or name</Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEB6C2]" />
            <Input
              id="student-lunch-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
              placeholder="e.g. 10457 or last name"
              className="h-12 pl-10"
            />
          </div>
          <Button
            type="button"
            className="h-12 w-full sm:w-auto"
            disabled={searching || !databaseEnabled}
            onClick={() => void handleSearch()}
            style={{ backgroundColor: accentColor }}
          >
            {searching ? "Searching…" : "Search"}
          </Button>
        </div>

        {results.length > 0 ? (
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto">
            {results.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => void selectStudent(student)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition hover:bg-[#041B52]/5"
                  style={{
                    borderColor:
                      selected?.id === student.id ? accentColor : "rgba(174,182,194,0.6)",
                  }}
                >
                  {student.photo ? (
                    <Image
                      src={student.photo}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9]"
                      style={{ color: accentColor }}
                    >
                      <UserRoundSearch className="h-4 w-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold" style={{ color: accentColor }}>
                      {student.firstName} {student.lastName}
                      {student.disabled ? " (disabled)" : ""}
                    </span>
                    <span className="block text-xs text-[#64748B]">
                      Grade {student.grade} · MD ID {student.id}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {selected ? (
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            {selected.photo ? (
              <Image
                src={selected.photo}
                alt=""
                width={56}
                height={56}
                className="h-14 w-14 rounded-2xl object-cover"
              />
            ) : null}
            <div>
              <h2 className="text-lg font-semibold" style={{ color: accentColor }}>
                {selected.firstName} {selected.lastName}
              </h2>
              <p className="text-sm text-[#64748B]">
                Grade {selected.grade} · MD ID {selected.id} · Balance{" "}
                {formatCurrency(selected.balance)}
              </p>
            </div>
          </div>

          {selected.disabled ? (
            <div className="mt-4 rounded-2xl border border-[#D62828]/35 bg-[#D62828]/5 px-4 py-3">
              <p className="flex items-center gap-2 font-semibold text-[#D62828]">
                <AlertTriangle className="h-4 w-4" />
                Student account is disabled
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                This student cannot be signed up for lunch until an admin re-enables the account in
                Student Manager.
              </p>
            </div>
          ) : (
            <>
              <h3 className="mt-6 text-sm font-semibold" style={{ color: accentColor }}>
                Published menu days
              </h3>
              {menuDays.length === 0 ? (
                <p className="mt-2 text-sm text-[#64748B]">
                  No published lunch menus are available yet. Publish menu days on the calendar
                  first.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {menuDays.map((day) => {
                    const sel = daySelections[day.date] ?? emptyDaySelection(false)
                    const pizza = isPizzaDayName(day.title)
                    return (
                      <li
                        key={day.date}
                        className="rounded-2xl border border-[#AEB6C2]/50 px-3 py-3 sm:px-4"
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={sel.selected}
                            onChange={() => toggleDay(day.date)}
                            className="mt-1 h-4 w-4 accent-[#041B52]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium" style={{ color: accentColor }}>
                              {day.date === today
                                ? `Today · ${formatReservationDateShort(day.date)}`
                                : formatReservationDateShort(day.date)}
                            </span>
                            <span className="block text-sm text-[#64748B]">{day.title}</span>
                          </span>
                        </label>

                        {sel.selected ? (
                          <div className="mt-3 space-y-2 border-t border-[#AEB6C2]/40 pt-3 pl-7">
                            {MEAL_OPTIONS.map((opt) => (
                              <label
                                key={opt.value}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                                style={{ color: accentColor }}
                              >
                                <input
                                  type="checkbox"
                                  checked={sel.meals[opt.value]}
                                  onChange={() => toggleMeal(day.date, opt.value)}
                                  className="h-4 w-4 accent-[#041B52]"
                                />
                                {opt.label}
                                {opt.value === "MAIN" && pizza
                                  ? " ($1.00 / slice)"
                                  : ` (${formatCurrency(opt.defaultPrice)})`}
                              </label>
                            ))}
                            {pizza && sel.meals.MAIN ? (
                              <PizzaSlicePicker
                                sliceCount={sel.sliceCount}
                                onChange={(n) => setSlices(day.date, n)}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}

              {error ? <p className="mt-4 text-sm text-[#D62828]">{error}</p> : null}
              {message ? <p className="mt-4 text-sm text-[#00A83E]">{message}</p> : null}

              <Button
                type="button"
                className="mt-5 w-full sm:w-auto"
                disabled={submitting || pendingItems.length === 0 || menuDays.length === 0}
                onClick={() => void handleSave()}
                style={{ backgroundColor: accentColor }}
              >
                {submitting
                  ? "Saving…"
                  : pendingItems.length > 0
                    ? `Save ${pendingItems.length} lunch item${pendingItems.length === 1 ? "" : "s"}`
                    : "Save lunch signup"}
              </Button>
            </>
          )}
        </Card>
      ) : null}

      {!selected && error ? (
        <p className="text-sm text-[#D62828]">{error}</p>
      ) : null}

      {selected && !selected.disabled && upcomingReservations.length > 0 ? (
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold" style={{ color: accentColor }}>
            Saved lunch reservations
          </h3>
          <ul className="mt-3 space-y-2">
            {upcomingReservations.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#AEB6C2]/30 py-2 text-sm last:border-0"
              >
                <span style={{ color: accentColor }}>
                  {formatReservationDateShort(row.date)}
                </span>
                <span className="text-[#64748B]">{formatReservationDetailLine(row)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}
