"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Label, Select } from "@/components/ui/input"
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
import { formatCurrency } from "@/lib/utils"

type MealType = "MAIN" | "SIDE" | "MILK"

const MEAL_OPTIONS: { value: MealType; label: string; defaultPrice: number }[] = [
  { value: "MAIN", label: "Main Meal", defaultPrice: DEFAULT_ONBOARDING_PRICING.mainMealPrice },
  { value: "SIDE", label: "Side", defaultPrice: DEFAULT_ONBOARDING_PRICING.sideMealPrice },
  { value: "MILK", label: "Milk", defaultPrice: MILK_JUICE_PRICE },
]

interface ReservationRow {
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

function StudentOrderLunchContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { calendarEvents, databaseEnabled } = useDemo()
  const dateParam = searchParams.get("date") ?? ""

  const [studentId, setStudentId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(dateParam)
  const [mealType, setMealType] = useState<MealType>("MAIN")
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationRow[]>([])

  const today = todayDateKey()
  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])
  const menuDates = useMemo(() => {
    return publicEvents
      .filter(
        (e) => e.category === "menu_day" && e.date >= today && isSchoolLunchDateKey(e.date)
      )
      .map((e) => e.date)
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort()
  }, [publicEvents, today])

  const selectedMenu = useMemo(
    () => publicEvents.find((e) => e.category === "menu_day" && e.date === selectedDate),
    [publicEvents, selectedDate]
  )

  const pizzaDay = mealType === "MAIN" && isPizzaDayName(selectedMenu?.title)
  const orderTotal = pizzaDay
    ? pizzaSliceTotal(sliceCount)
    : MEAL_OPTIONS.find((m) => m.value === mealType)?.defaultPrice ??
      DEFAULT_ONBOARDING_PRICING.mainMealPrice

  const submitLabel = useMemo(() => {
    if (!selectedDate) return "Order lunch"
    if (selectedDate === today) return "Order lunch for today"
    const label = new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    return `Order lunch for ${label}`
  }, [selectedDate, today])

  const loadReservations = useCallback(async () => {
    if (!user || !databaseEnabled) return
    const res = await fetch("/api/lunch-reservations", {
      headers: { "x-session-user-id": user.id },
    })
    if (res.ok) {
      const data = await res.json()
      setReservations(data.reservations ?? [])
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function loadMe() {
      const res = await fetch("/api/student/me", {
        headers: { "x-session-user-id": user!.id },
      })
      const data = (await res.json().catch(() => ({}))) as {
        student?: { externalId: string }
        error?: string
      }
      if (cancelled) return
      if (!res.ok || !data.student) {
        setError(data.error ?? "Unable to load your student account")
        return
      }
      setStudentId(data.student.externalId)
    }
    void loadMe()
    void loadReservations()
    return () => {
      cancelled = true
    }
  }, [user, loadReservations])

  useEffect(() => {
    if (!selectedDate) {
      if (dateParam && menuDates.includes(dateParam)) {
        setSelectedDate(dateParam)
      } else if (menuDates[0]) {
        setSelectedDate(menuDates[0])
      }
    }
  }, [menuDates, selectedDate, dateParam])

  async function handleSubmit() {
    setError(null)
    setMessage(null)
    if (!user || !studentId || !selectedDate) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/lunch-reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-user-id": user.id,
        },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          mealType,
          price: orderTotal,
          ...(pizzaDay ? { sliceCount } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to order lunch")
        return
      }
      const slices = data.reservation?.sliceCount
      setMessage(
        slices
          ? `Ordered ${data.menuTitle ?? "meal"} (${slices} ${
              slices === 1 ? "slice" : "slices"
            }). Total: ${formatCurrency(data.reservation.totalAmount ?? orderTotal)}. Your parents were notified.`
          : `Ordered ${data.menuTitle ?? "meal"}. Your parents were notified.`
      )
      await loadReservations()
    } catch {
      setError("Unable to order lunch. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#041B52]">Order lunch</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Choose a published menu day and meal for yourself only.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>Date (published menu)</Label>
            <Select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              {menuDates.length === 0 ? (
                <option value="">No published menus</option>
              ) : (
                menuDates.map((date) => (
                  <option key={date} value={date}>
                    {date === today
                      ? `Today (${date})`
                      : new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                  </option>
                ))
              )}
            </Select>
          </div>
          {selectedMenu ? (
            <p className="text-sm text-[#64748B]">
              Menu: <span className="font-medium text-[#041B52]">{selectedMenu.title}</span>
            </p>
          ) : null}
          <div>
            <Label>Meal</Label>
            <Select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
              {MEAL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.value === "MAIN" && pizzaDay
                    ? ` ($1.00 / slice)`
                    : ` (${formatCurrency(option.defaultPrice)})`}
                </option>
              ))}
            </Select>
          </div>
          {pizzaDay ? (
            <PizzaSlicePicker sliceCount={sliceCount} onChange={setSliceCount} />
          ) : null}
          {error ? <p className="text-sm text-[#D62828]">{error}</p> : null}
          {message ? <p className="text-sm text-[#00A83E]">{message}</p> : null}
          <Button
            type="button"
            className="w-full"
            disabled={submitting || !selectedDate || !studentId || menuDates.length === 0}
            onClick={() => void handleSubmit()}
          >
            {submitting
              ? "Ordering..."
              : pizzaDay
                ? `${submitLabel} · Total: ${formatCurrency(orderTotal)}`
                : submitLabel}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[#041B52]">Recent orders</h2>
        {reservations.length === 0 ? (
          <p className="mt-3 text-sm text-[#64748B]">No lunch orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E2E8F0]">
            {reservations.slice(0, 5).map((row) => (
              <li key={row.id} className="py-3 text-sm">
                <p className="font-medium text-[#041B52]">{row.date}</p>
                <p className="text-[#64748B]">
                  {row.mealType.replace(/_/g, " ")}
                  {row.sliceCount
                    ? ` · ${row.sliceCount} ${row.sliceCount === 1 ? "slice" : "slices"}`
                    : ""}{" "}
                  · {formatCurrency(row.totalAmount ?? row.price)} · {row.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function StudentOrderLunchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#64748B]">Loading lunch order options...</p>}>
      <StudentOrderLunchContent />
    </Suspense>
  )
}
