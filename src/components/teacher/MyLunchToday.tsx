"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { CheckCircle2 } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"
import { isPublicCalendarEvent, todayDateKey } from "@/lib/calendar-publish"
import {
  DEFAULT_PIZZA_SLICES,
  isPizzaDayName,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import { formatCurrency } from "@/lib/utils"
import type { TeacherPaymentMethod } from "@/lib/teacher/types"

const PAYMENT_LABELS: Record<TeacherPaymentMethod, string> = {
  account: "Account",
  prepay_online: "Prepay Online",
  pay_at_kiosk: "Pay At Kiosk",
}

export function MyLunchToday() {
  const { reservation, updateTeacherReservation } = useTeacherData()
  const { calendarEvents } = useDemo()
  const [ordering, setOrdering] = useState(false)
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)

  const todayMenuTitle = useMemo(() => {
    const today = todayDateKey()
    return calendarEvents.find(
      (e) => e.date === today && e.category === "menu_day" && isPublicCalendarEvent(e)
    )?.title
  }, [calendarEvents])

  const pizzaDay = isPizzaDayName(todayMenuTitle ?? reservation?.mealName)
  const orderTotal = pizzaDay ? pizzaSliceTotal(sliceCount) : undefined

  async function handleReserve() {
    setSubmitting(true)
    try {
      const action =
        reservation && reservation.status !== "cancelled" ? "change" : "reserve"
      await updateTeacherReservation("account", action, {
        sliceCount: pizzaDay ? sliceCount : undefined,
      })
      setOrdering(false)
      setSliceCount(DEFAULT_PIZZA_SLICES)
    } finally {
      setSubmitting(false)
    }
  }

  if (!reservation || reservation.status === "cancelled") {
    return (
      <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          My Lunch Today
        </h2>
        {!ordering ? (
          <>
            <p className="mt-4 text-sm text-silver-foreground">No lunch reserved for today.</p>
            {todayMenuTitle ? (
              <p className="mt-2 text-sm text-silver-foreground">
                Menu: <span className="font-medium" style={{ color: TEACHER_NAVY }}>{todayMenuTitle}</span>
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
                Menu: <span className="font-medium" style={{ color: TEACHER_NAVY }}>{todayMenuTitle}</span>
              </p>
            ) : null}
            {pizzaDay ? (
              <PizzaSlicePicker sliceCount={sliceCount} onChange={setSliceCount} />
            ) : (
              <p className="text-sm text-silver-foreground">Confirm to reserve today’s staff lunch.</p>
            )}
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
                  setSliceCount(DEFAULT_PIZZA_SLICES)
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
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        My Lunch Today
      </h2>
      <div className="mt-4 flex gap-4">
        <Image
          src={reservation.mealPhotoUrl}
          alt={reservation.mealName}
          width={120}
          height={120}
          className="h-28 w-28 rounded-2xl object-cover"
        />
        <div className="flex-1">
          <p className="text-lg font-semibold" style={{ color: TEACHER_NAVY }}>
            {reservation.mealName}
          </p>
          <p className="text-sm font-medium text-silver-foreground">
            {reservation.sliceCount
              ? `${reservation.sliceCount} ${
                  reservation.sliceCount === 1 ? "slice" : "slices"
                } · ${formatCurrency(reservation.totalAmount ?? reservation.mealPrice)}`
              : formatCurrency(reservation.mealPrice)}
          </p>
          <p className="mt-2 text-sm text-silver-foreground">
            Paid with: {PAYMENT_LABELS[reservation.paymentMethod]}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Reserved
          </div>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateTeacherReservation(reservation.paymentMethod, "cancel")}
        >
          Cancel
        </Button>
      </div>
      {ordering ? (
        <div className="mt-4 space-y-4 rounded-xl border border-[#C8CDD7] bg-[#F8F9FB] p-4">
          {pizzaDay ? (
            <PizzaSlicePicker sliceCount={sliceCount} onChange={setSliceCount} />
          ) : (
            <p className="text-sm text-silver-foreground">Update today’s lunch reservation.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button disabled={submitting} onClick={() => void handleReserve()}>
              {submitting
                ? "Saving..."
                : pizzaDay && orderTotal != null
                  ? `Save · Total: ${formatCurrency(orderTotal)}`
                  : "Save changes"}
            </Button>
            <Button
              variant="outline"
              disabled={submitting}
              onClick={() => setOrdering(false)}
            >
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
