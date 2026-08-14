"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { isPublicCalendarEvent, todayDateKey } from "@/lib/calendar-publish"
import {
  DEFAULT_PIZZA_SLICES,
  isPizzaDayName,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import { formatCurrency } from "@/lib/utils"
import { STUDENT_LUNCH_PRICE } from "@/config/onboarding-pricing"

type StaffLunchReservation = {
  id: string
  mealName: string
  mealPrice: number
  sliceCount?: number | null
  unitPrice?: number | null
  totalAmount?: number | null
  status: string
}

export function StaffMyLunchToday() {
  const { user } = useAuth()
  const { databaseEnabled, calendarEvents } = useDemo()
  const [reservation, setReservation] = useState<StaffLunchReservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todayMenuTitle = useMemo(() => {
    const today = todayDateKey()
    return calendarEvents.find(
      (e) => e.date === today && e.category === "menu_day" && isPublicCalendarEvent(e)
    )?.title
  }, [calendarEvents])

  const pizzaDay = isPizzaDayName(todayMenuTitle ?? reservation?.mealName)
  const orderTotal = pizzaDay ? pizzaSliceTotal(sliceCount) : undefined

  const loadReservation = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setReservation(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/lunch/reservation?staffId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setReservation(data.reservation ?? null)
      } else {
        setReservation(null)
      }
    } finally {
      setLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadReservation()
  }, [loadReservation])

  async function handleReserve() {
    if (!user) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/staff/lunch/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: user.id,
          paymentMethod: "account",
          action: "reserve",
          ...(pizzaDay ? { sliceCount } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Unable to order lunch.")
        return
      }
      setOrdering(false)
      await loadReservation()
    } catch {
      setError("Unable to order lunch. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!user) return
    setSubmitting(true)
    try {
      await fetch("/api/staff/lunch/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: user.id,
          paymentMethod: "account",
          action: "cancel",
        }),
      })
      setOrdering(false)
      await loadReservation()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border p-4 shadow-sm sm:p-6" style={{ borderColor: STAFF_SILVER }}>
        <p className="text-sm text-silver-foreground">Loading today’s lunch…</p>
      </Card>
    )
  }

  if (!reservation || reservation.status === "cancelled") {
    return (
      <Card className="rounded-2xl border p-4 shadow-sm sm:p-6" style={{ borderColor: STAFF_SILVER }}>
        <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
          My Lunch Today
        </h2>
        {!ordering ? (
          <>
            <p className="mt-3 text-sm text-silver-foreground">No lunch reserved for today.</p>
            {todayMenuTitle ? (
              <p className="mt-2 text-sm text-silver-foreground">
                Menu:{" "}
                <span className="font-medium" style={{ color: STAFF_NAVY }}>
                  {todayMenuTitle}
                </span>
              </p>
            ) : null}
            <Button className="mt-4" onClick={() => setOrdering(true)}>
              Order lunch for today
            </Button>
          </>
        ) : (
          <div className="mt-4 space-y-4">
            {todayMenuTitle ? (
              <p className="text-sm text-silver-foreground">
                Menu:{" "}
                <span className="font-medium" style={{ color: STAFF_NAVY }}>
                  {todayMenuTitle}
                </span>
              </p>
            ) : null}
            {pizzaDay ? (
              <PizzaSlicePicker sliceCount={sliceCount} onChange={setSliceCount} />
            ) : (
              <p className="text-sm text-silver-foreground">
                Confirm to reserve today’s staff lunch · {formatCurrency(STUDENT_LUNCH_PRICE)}.
              </p>
            )}
            {error ? <p className="text-sm text-[#D62828]">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button disabled={submitting} onClick={() => void handleReserve()}>
                {submitting
                  ? "Ordering..."
                  : pizzaDay && orderTotal != null
                    ? `Confirm order · Total: ${formatCurrency(orderTotal)}`
                    : "Confirm order"}
              </Button>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setOrdering(false)
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border p-4 shadow-sm sm:p-6" style={{ borderColor: STAFF_SILVER }}>
      <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
        My Lunch Today
      </h2>
      <div className="mt-4">
        <p className="text-lg font-semibold" style={{ color: STAFF_NAVY }}>
          {reservation.mealName}
        </p>
        <p className="mt-1 text-sm text-silver-foreground">
          {reservation.sliceCount
            ? `${reservation.sliceCount} ${
                reservation.sliceCount === 1 ? "slice" : "slices"
              } · ${formatCurrency(reservation.totalAmount ?? reservation.mealPrice)}`
            : formatCurrency(reservation.mealPrice)}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" />
          Reserved
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSliceCount(reservation.sliceCount ?? DEFAULT_PIZZA_SLICES)
            setOrdering(true)
          }}
        >
          Change order
        </Button>
        <Button variant="outline" size="sm" disabled={submitting} onClick={() => void handleCancel()}>
          Cancel
        </Button>
      </div>
      {ordering ? (
        <div className="mt-4 space-y-4 rounded-xl border bg-[#F8F9FB] p-4" style={{ borderColor: STAFF_SILVER }}>
          {pizzaDay ? (
            <PizzaSlicePicker sliceCount={sliceCount} onChange={setSliceCount} />
          ) : (
            <p className="text-sm text-silver-foreground">Update today’s lunch reservation.</p>
          )}
          {error ? <p className="text-sm text-[#D62828]">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={submitting} onClick={() => void handleReserve()}>
              {submitting
                ? "Saving..."
                : pizzaDay && orderTotal != null
                  ? `Save · Total: ${formatCurrency(orderTotal)}`
                  : "Save changes"}
            </Button>
            <Button variant="outline" disabled={submitting} onClick={() => setOrdering(false)}>
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
