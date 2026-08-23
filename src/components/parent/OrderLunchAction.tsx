"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Label, Select } from "@/components/ui/input"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { useParentLunchReservations } from "@/hooks/useParentLunchReservations"
import { DEFAULT_ONBOARDING_PRICING } from "@/config/onboarding-pricing"
import { todayDateKey } from "@/lib/calendar-publish"
import {
  DEFAULT_PIZZA_SLICES,
  isPizzaDayName,
  pizzaSliceTotal,
} from "@/lib/pizza-day"
import { formatCurrency } from "@/lib/utils"
import {
  formatReservationConfirmation,
  isActiveReservation,
} from "@/lib/parent-lunch-reservations"

type OrderLunchActionProps = {
  /** Calendar day to order for (YYYY-MM-DD). */
  date: string
  /** Optional published menu title for confirmation copy. */
  menuTitle?: string
  /** When false, hide the action (e.g. no lunch menu that day). */
  enabled?: boolean
  className?: string
  /** Called after a successful reservation so the calendar can refresh marks. */
  onReserved?: () => void
}

function orderButtonLabel(date: string): string {
  const today = todayDateKey()
  if (date === today) return "Order lunch for today"
  const label = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  return `Order lunch for ${label}`
}

/**
 * Plain-language lunch order control for parent menu views.
 * Creates a LunchReservation (MAIN meal) via /api/lunch-reservations.
 * Supports multi-child parents: switch students and order again in the same session.
 */
export function OrderLunchAction({
  date,
  menuTitle,
  enabled = true,
  className = "",
  onReserved,
}: OrderLunchActionProps) {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const { students: linkedStudents, isLoading } = useParentLinkedStudents()
  const { reservations, reload: reloadReservations } = useParentLunchReservations()

  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState("")
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const buttonLabel = useMemo(() => orderButtonLabel(date), [date])
  const pizzaDay = isPizzaDayName(menuTitle)
  const orderTotal = pizzaDay
    ? pizzaSliceTotal(sliceCount)
    : DEFAULT_ONBOARDING_PRICING.mainMealPrice

  const reservedMainStudentIds = useMemo(() => {
    return new Set(
      reservations
        .filter(
          (row) =>
            row.date === date &&
            row.mealType.toUpperCase() === "MAIN" &&
            isActiveReservation(row)
        )
        .map((row) => row.studentId)
    )
  }, [reservations, date])

  const nextOpenStudentId = useMemo(() => {
    const prefer = linkedStudents.find((s) => !reservedMainStudentIds.has(s.id))
    return prefer?.id ?? linkedStudents[0]?.id ?? ""
  }, [linkedStudents, reservedMainStudentIds])

  const remainingToOrder = useMemo(
    () => linkedStudents.filter((s) => !reservedMainStudentIds.has(s.id)),
    [linkedStudents, reservedMainStudentIds]
  )

  useEffect(() => {
    if (!studentId && nextOpenStudentId) {
      setStudentId(nextOpenStudentId)
    }
  }, [linkedStudents, studentId, nextOpenStudentId])

  if (!enabled || !user) return null

  function openOrderForm(preferredStudentId?: string) {
    setConfirmation(null)
    setError(null)
    setSliceCount(DEFAULT_PIZZA_SLICES)
    const pick =
      preferredStudentId ||
      linkedStudents.find((s) => s.id !== studentId && !reservedMainStudentIds.has(s.id))?.id ||
      nextOpenStudentId ||
      linkedStudents[0]?.id ||
      ""
    if (pick) setStudentId(pick)
    setOpen(true)
  }

  async function handleOrder() {
    setError(null)
    setConfirmation(null)
    if (!user || !studentId) return

    if (!databaseEnabled) {
      setError("Ordering needs a live school connection. Try again when the system is online.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/lunch-reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-user-id": user.id,
        },
        body: JSON.stringify({
          parentUserId: user.id,
          studentId,
          date,
          mealType: "MAIN",
          price: orderTotal,
          ...(pizzaDay ? { sliceCount } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Unable to order lunch. Try again.")
        return
      }
      const childName = data.reservation?.studentName ?? "your student"
      const meal = data.menuTitle ?? menuTitle ?? "lunch"
      const slices = data.reservation?.sliceCount
      setConfirmation(
        formatReservationConfirmation({
          studentName: childName,
          date,
          mealType: "MAIN",
          menuTitle: meal,
          sliceCount: slices,
          totalAmount: data.reservation?.totalAmount ?? orderTotal,
          price: data.reservation?.price ?? orderTotal,
        })
      )
      setOpen(false)
      await reloadReservations()
      onReserved?.()
    } catch {
      setError("Unable to order lunch. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const showOrderAnother =
    Boolean(confirmation) && linkedStudents.length > 1 && remainingToOrder.length > 0

  return (
    <div className={`mt-4 space-y-3 ${className}`}>
      {confirmation ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-[#00A83E]/30 bg-[#00A83E]/5 px-4 py-3 text-sm"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00A83E]" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#041B52]">{confirmation}</p>
            <p className="mt-1 text-[#64748B]">
              {formatCurrency(orderTotal)}
              {pizzaDay ? " · Pizza Day" : " main meal"} · charged to the student lunch account
            </p>
            {showOrderAnother ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  const next =
                    linkedStudents.find(
                      (s) => s.id !== studentId && !reservedMainStudentIds.has(s.id)
                    )?.id ?? nextOpenStudentId
                  openOrderForm(next)
                }}
              >
                Order for another child
              </Button>
            ) : linkedStudents.length > 1 && remainingToOrder.length === 0 ? (
              <p className="mt-2 text-xs text-[#64748B]">
                All linked children already have a main lunch reserved for this day.
              </p>
            ) : null}
          </div>
        </div>
      ) : !open ? (
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={isLoading || linkedStudents.length === 0}
          onClick={() => openOrderForm(nextOpenStudentId)}
        >
          {buttonLabel}
        </Button>
      ) : (
        <div className="rounded-xl border border-[#C8CDD7] bg-[#F8F9FB] p-4">
          <p className="text-sm font-semibold text-[#041B52]">{buttonLabel}</p>
          {linkedStudents.length === 0 ? (
            <p className="mt-2 text-sm text-[#64748B]">
              No students are linked to your account yet. Ask the school office to link your
              children.
            </p>
          ) : (
            <>
              <div className="mt-3">
                <Label htmlFor={`order-lunch-student-${date}`}>Which child?</Label>
                <Select
                  id={`order-lunch-student-${date}`}
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value)
                    setError(null)
                    setSliceCount(DEFAULT_PIZZA_SLICES)
                  }}
                  className="mt-1"
                >
                  {linkedStudents.map((student) => {
                    const already = reservedMainStudentIds.has(student.id)
                    return (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                        {already ? " — already ordered" : ""}
                      </option>
                    )
                  })}
                </Select>
                {linkedStudents.length > 1 ? (
                  <p className="mt-1.5 text-xs text-[#64748B]">
                    Each child gets their own lunch reservation for this day.
                  </p>
                ) : null}
              </div>
              {menuTitle ? (
                <p className="mt-3 text-sm text-[#64748B]">
                  Menu: <span className="font-medium text-[#041B52]">{menuTitle}</span>
                </p>
              ) : null}
              {pizzaDay ? (
                <PizzaSlicePicker
                  id={`order-lunch-slices-${date}`}
                  sliceCount={sliceCount}
                  onChange={setSliceCount}
                  className="mt-3"
                />
              ) : (
                <p className="mt-2 text-sm text-[#64748B]">
                  Main meal · {formatCurrency(DEFAULT_ONBOARDING_PRICING.mainMealPrice)}
                </p>
              )}
              {error ? <p className="mt-2 text-sm text-[#D62828]">{error}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={submitting || !studentId}
                  onClick={() => void handleOrder()}
                >
                  {submitting
                    ? "Ordering..."
                    : pizzaDay
                      ? `Confirm order · Total: ${formatCurrency(orderTotal)}`
                      : "Confirm order"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => {
                    setOpen(false)
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {!confirmation ? (
        <p className="text-xs text-[#64748B]">
          Need sides or another day?{" "}
          <Link
            href={`/parent/reserve-lunch?date=${encodeURIComponent(date)}${
              studentId ? `&studentId=${encodeURIComponent(studentId)}` : ""
            }`}
            className="font-semibold text-[#041B52] underline-offset-2 hover:underline"
          >
            More lunch options
          </Link>
        </p>
      ) : null}

      {error && !open ? <p className="text-sm text-[#D62828]">{error}</p> : null}
    </div>
  )
}
