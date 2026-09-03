"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CalendarDays, UtensilsCrossed } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { MenuDayDetails } from "@/components/calendar/MenuDayDetails"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { madonnaOptionBtn } from "@/components/nav/madonna-option-classes"
import { Button } from "@/components/ui/button"
import { Label, Select } from "@/components/ui/input"
import { filterPublicCalendarEvents, todayDateKey } from "@/lib/calendar-publish"
import { isSchoolLunchDateKey } from "@/lib/calendar"
import { getMealCoverPhoto } from "@/lib/meal-templates"
import { resolveMenuDay } from "@/lib/menu-day-details"
import {
  DEFAULT_ONBOARDING_PRICING,
  MILK_JUICE_PRICE,
} from "@/config/onboarding-pricing"
import {
  DEFAULT_PIZZA_SLICES,
  isPizzaDayName,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import { cn, formatCurrency } from "@/lib/utils"

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
  const { calendarEvents, mealTemplates, databaseEnabled } = useDemo()
  const dateParam = searchParams.get("date") ?? ""

  const [studentId, setStudentId] = useState<string | null>(null)
  const [mealType, setMealType] = useState<MealType>("MAIN")
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationRow[]>([])

  const today = todayDateKey()
  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])
  const mealTemplatesById = useMemo(
    () => new Map(mealTemplates.map((t) => [t.id, t])),
    [mealTemplates]
  )

  const orderDate = useMemo(() => {
    if (dateParam && isSchoolLunchDateKey(dateParam)) return dateParam
    return today
  }, [dateParam, today])

  const isToday = orderDate === today

  const selectedMenu = useMemo(
    () => publicEvents.find((e) => e.category === "menu_day" && e.date === orderDate),
    [publicEvents, orderDate]
  )

  const resolved = useMemo(
    () => (selectedMenu ? resolveMenuDay(selectedMenu, mealTemplatesById) : null),
    [selectedMenu, mealTemplatesById]
  )

  const cover = useMemo(() => {
    if (!resolved?.template) return undefined
    return getMealCoverPhoto(resolved.template.photos)
  }, [resolved])

  const pizzaDay =
    mealType === "MAIN" && isPizzaDayName(selectedMenu?.title ?? resolved?.mainName)
  const orderTotal = pizzaDay
    ? pizzaSliceTotal(sliceCount)
    : MEAL_OPTIONS.find((m) => m.value === mealType)?.defaultPrice ??
      DEFAULT_ONBOARDING_PRICING.mainMealPrice

  const dateLabel = useMemo(() => {
    return new Date(`${orderDate}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }, [orderDate])

  const submitLabel = isToday
    ? "Order Lunch"
    : `Order lunch for ${new Date(`${orderDate}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}`

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

  async function handleSubmit() {
    setError(null)
    setMessage(null)
    if (!user || !studentId || !selectedMenu) return

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
          date: orderDate,
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
          {isToday
            ? "Today’s lunch is shown below. Use the month calendar to sign up for future days."
            : "Review this day’s lunch, then confirm your order. You can only order for yourself."}
        </p>
      </section>

      <section className="rounded-2xl border border-[#C8CDD7] bg-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
          {isToday ? "Today’s lunch" : "Lunch for this day"}
        </p>
        <p className="mt-1 text-sm text-[#64748B]">{dateLabel}</p>

        {!selectedMenu ? (
          <div className="mt-4 flex items-start gap-3">
            <UtensilsCrossed className="mt-0.5 h-5 w-5 shrink-0 text-[#64748B]" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-[#041B52]">
                {isToday ? "No lunch menu published for today" : "No lunch menu for this day"}
              </p>
              <p className="mt-2 text-sm text-[#64748B]">
                {isToday
                  ? "Check the month calendar to sign up for other school days ahead of time."
                  : "Pick another day from the month calendar."}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover}
                  alt={resolved?.mainName ?? selectedMenu.title}
                  className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                />
              ) : (
                <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] sm:h-28 sm:w-28">
                  <UtensilsCrossed className="h-8 w-8 text-[#64748B]" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <MenuDayDetails
                  event={selectedMenu}
                  mealTemplatesById={mealTemplatesById}
                  compact
                />
              </div>
            </div>

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
              disabled={submitting || !studentId}
              onClick={() => void handleSubmit()}
            >
              {submitting
                ? "Ordering..."
                : pizzaDay
                  ? `${submitLabel} · Total: ${formatCurrency(orderTotal)}`
                  : submitLabel}
            </Button>
          </div>
        )}

        {!selectedMenu && error ? <p className="mt-3 text-sm text-[#D62828]">{error}</p> : null}

        <Link
          href="/student/calendar"
          className={cn(
            madonnaOptionBtn({ shape: "rounded" }),
            "mt-5 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-bold"
          )}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          View month calendar · Sign up ahead
        </Link>
      </section>

      {!isToday ? (
        <p className="text-sm text-[#64748B]">
          <Link href="/student/order" className="font-semibold text-[#041B52] underline">
            Back to today’s lunch
          </Link>
        </p>
      ) : null}

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
