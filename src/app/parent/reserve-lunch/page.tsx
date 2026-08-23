"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ModuleShell } from "@/components/layout/ModuleShell"
import { useAgreementStatus } from "@/components/agreements/useAgreementStatus"
import { useDemo } from "@/components/providers/DemoProvider"
import { useAuth } from "@/components/providers/AuthProvider"
import { formatStudentAgreementStatus, isLunchSignupAllowed } from "@/lib/agreements/student-status"
import { getPendingSubmission, getStudentProfile } from "@/lib/student-profiles"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import {
  getFoodProfileDisplayLabel,
  getFoodProfileStatus,
  isDietaryFormBlocking,
} from "@/lib/types"
import { PizzaSlicePicker } from "@/components/lunch/PizzaSlicePicker"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
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

function ParentReserveLunchContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { students, requiresSignature, loading } = useAgreementStatus()
  const { studentProfiles, allergySubmissions, calendarEvents, databaseEnabled } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()

  const dateParam = searchParams.get("date") ?? ""
  const studentParam = searchParams.get("studentId") ?? ""

  const [selectedStudentId, setSelectedStudentId] = useState(studentParam)
  const [selectedDate, setSelectedDate] = useState(dateParam)
  const [mealType, setMealType] = useState<MealType>("MAIN")
  const [sliceCount, setSliceCount] = useState(DEFAULT_PIZZA_SLICES)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationRow[]>([])

  const statusByStudent = new Map(students.map((s) => [s.studentId, s]))
  const today = todayDateKey()

  const publicEvents = useMemo(() => filterPublicCalendarEvents(calendarEvents), [calendarEvents])

  const menuDates = useMemo(() => {
    return publicEvents
      .filter(
        (e) =>
          e.category === "menu_day" && e.date >= today && isSchoolLunchDateKey(e.date)
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
    : MEAL_OPTIONS.find((m) => m.value === mealType)?.defaultPrice ?? DEFAULT_ONBOARDING_PRICING.mainMealPrice

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
    const res = await fetch(`/api/lunch-reservations?parentUserId=${user.id}`, {
      headers: { "x-session-user-id": user.id },
    })
    if (res.ok) {
      const data = await res.json()
      setReservations(data.reservations ?? [])
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadReservations()
  }, [loadReservations])

  useEffect(() => {
    if (!selectedStudentId && (studentParam || linkedStudents[0]?.id)) {
      setSelectedStudentId(studentParam || linkedStudents[0]!.id)
    }
    if (!selectedDate) {
      if (dateParam && menuDates.includes(dateParam)) {
        setSelectedDate(dateParam)
      } else if (menuDates[0]) {
        setSelectedDate(menuDates[0])
      }
    }
  }, [linkedStudents, menuDates, selectedDate, selectedStudentId, dateParam, studentParam])

  async function handleSubmit() {
    setError(null)
    setMessage(null)
    if (!user || !selectedStudentId || !selectedDate) return

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
          studentId: selectedStudentId,
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
            }) for ${data.reservation.studentName}. Total: ${formatCurrency(
              data.reservation.totalAmount ?? orderTotal
            )}.`
          : `Ordered ${data.menuTitle ?? "meal"} for ${data.reservation.studentName}.`
      )
      await loadReservations()
    } catch {
      setError("Unable to order lunch. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ModuleShell section="Parent Portal" title="Order Lunch" description="Loading eligibility...">
        <p className="text-[#AEB6C2]">Checking cafeteria agreement status...</p>
      </ModuleShell>
    )
  }

  if (requiresSignature) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Order Lunch"
        description="A signed cafeteria agreement is required before lunch enrollment."
      >
        <Card className="rounded-[20px] border-[#D62828]/30 bg-[#D62828]/5 p-8">
          <p className="font-semibold text-[#041B52]">Cafeteria Agreement Required</p>
          <p className="mt-2 text-sm text-[#64748B]">
            You must sign the current Fuel The Dons cafeteria agreement before ordering meals.
          </p>
          <Button asChild className="mt-6">
            <Link href="/parent/agreements">Sign Agreement</Link>
          </Button>
        </Card>
      </ModuleShell>
    )
  }

  if (linkedStudents.length === 0) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Order Lunch"
        description="Order meals for students with a signed cafeteria agreement."
      >
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <p className="font-semibold text-[#041B52]">No students linked yet</p>
          <p className="mt-2 text-sm text-[#64748B]">
            Link your student(s) to order lunch. Staff and teachers who are parents can link
            children from Settings → Add Child, or use Add Student from the parent portal.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login/parent/link">Link a student</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/parent/guide">Parent how-to guide</Link>
            </Button>
          </div>
        </Card>
      </ModuleShell>
    )
  }

  const selectedStudent = linkedStudents.find((s) => s.id === selectedStudentId) ?? linkedStudents[0]
  const selectedProfile = selectedStudent
    ? getStudentProfile(selectedStudent.id, studentProfiles)
    : undefined
  const selectedPending = selectedStudent
    ? getPendingSubmission(selectedStudent.id, allergySubmissions)
    : undefined
  const selectedDietaryBlocked = isDietaryFormBlocking(selectedProfile, selectedPending)

  if (selectedDietaryBlocked && selectedStudent) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Order Lunch"
        description="Complete the dietary and allergy form for this student before ordering."
      >
        <Card className="rounded-[20px] border-[#D62828]/30 bg-[#D62828]/5 p-8">
          <p className="font-semibold text-[#041B52]">Dietary &amp; Food Allergy Form Required</p>
          <p className="mt-2 text-sm text-[#64748B]">
            {selectedStudent.firstName} {selectedStudent.lastName} needs a current dietary and food
            allergy form before lunch orders for them can proceed. Other linked students can still
            be ordered for once you switch to them and their form is complete.
          </p>
          <p className="mt-3 text-xs font-bold uppercase text-[#D62828]">
            {getFoodProfileDisplayLabel(getFoodProfileStatus(selectedProfile, selectedPending))}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/parent/student-profile/${selectedStudent.id}?tab=dietary`}>
                Update dietary form
              </Link>
            </Button>
            {linkedStudents.length > 1 ? (
              <div className="w-full sm:w-auto">
                <Label>Order for a different student</Label>
                <Select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {linkedStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
        </Card>
      </ModuleShell>
    )
  }

  return (
    <ModuleShell
      section="Parent Portal"
      title="Order Lunch"
      description="Order meals from the published school lunch menu."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <h2 className="text-lg font-semibold text-[#041B52]">New Order</h2>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Student</Label>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {linkedStudents.map((student) => {
                  const agreement = statusByStudent.get(student.id)
                  const eligible = agreement ? isLunchSignupAllowed(agreement.status) : false
                  return (
                    <option key={student.id} value={student.id} disabled={!eligible}>
                      {student.firstName} {student.lastName}
                      {agreement ? ` — ${formatStudentAgreementStatus(agreement.status)}` : ""}
                    </option>
                  )
                })}
              </Select>
            </div>
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
              <Select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as MealType)}
              >
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
              className="w-full sm:w-auto"
              disabled={submitting || !selectedDate || menuDates.length === 0}
              onClick={() => void handleSubmit()}
            >
              {submitting
                ? "Ordering..."
                : pizzaDay
                  ? `${submitLabel} · Total: ${formatCurrency(orderTotal)}`
                  : submitLabel}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <h2 className="text-lg font-semibold text-[#041B52]">Your Orders</h2>
          {reservations.length === 0 ? (
            <p className="mt-4 text-sm text-[#64748B]">No lunch orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#AEB6C2]/40">
              {reservations.map((row) => (
                <li key={row.id} className="py-3 text-sm">
                  <p className="font-medium text-[#041B52]">
                    {row.studentName} — {row.date}
                  </p>
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
          <Button asChild variant="outline" className="mt-6">
            <Link href="/parent/calendar">View Meal Calendar</Link>
          </Button>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/parent/orders">All meal selections</Link>
          </Button>
        </Card>
      </div>
    </ModuleShell>
  )
}

export default function ParentReserveLunchPage() {
  return (
    <Suspense
      fallback={
        <ModuleShell section="Parent Portal" title="Order Lunch" description="Loading...">
          <p className="text-[#AEB6C2]">Loading lunch order options...</p>
        </ModuleShell>
      }
    >
      <ParentReserveLunchContent />
    </Suspense>
  )
}
