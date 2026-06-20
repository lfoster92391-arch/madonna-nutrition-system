"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label, Select } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

type MealType = "MAIN" | "SIDE" | "ALA_CARTE" | "MILK"

const MEAL_OPTIONS: { value: MealType; label: string; defaultPrice: number }[] = [
  { value: "MAIN", label: "Main Meal", defaultPrice: 3 },
  { value: "SIDE", label: "Side", defaultPrice: 2 },
  { value: "ALA_CARTE", label: "A La Carte", defaultPrice: 4.5 },
  { value: "MILK", label: "Milk", defaultPrice: 0.75 },
]

interface ReservationRow {
  id: string
  studentId: string
  studentName: string
  date: string
  mealType: MealType
  price: number
  status: string
}

export default function ParentReserveLunchPage() {
  const { user } = useAuth()
  const { students, requiresSignature, loading } = useAgreementStatus()
  const { studentProfiles, allergySubmissions, calendarEvents, databaseEnabled } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()

  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [mealType, setMealType] = useState<MealType>("MAIN")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationRow[]>([])

  const statusByStudent = new Map(students.map((s) => [s.studentId, s]))

  const menuDates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return calendarEvents
      .filter((e) => e.category === "menu_day" && e.date >= today)
      .map((e) => e.date)
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort()
  }, [calendarEvents])

  const selectedMenu = useMemo(
    () => calendarEvents.find((e) => e.category === "menu_day" && e.date === selectedDate),
    [calendarEvents, selectedDate]
  )

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
    if (!selectedStudentId && linkedStudents[0]) {
      setSelectedStudentId(linkedStudents[0].id)
    }
    if (!selectedDate && menuDates[0]) {
      setSelectedDate(menuDates[0])
    }
  }, [linkedStudents, menuDates, selectedDate, selectedStudentId])

  async function handleSubmit() {
    setError(null)
    setMessage(null)
    if (!user || !selectedStudentId || !selectedDate) return

    setSubmitting(true)
    try {
      const price = MEAL_OPTIONS.find((m) => m.value === mealType)?.defaultPrice ?? 3
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
          price,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Unable to reserve lunch")
        return
      }
      setMessage(`Reserved ${data.menuTitle ?? "meal"} for ${data.reservation.studentName}.`)
      await loadReservations()
    } catch {
      setError("Unable to reserve lunch. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ModuleShell section="Parent Portal" title="Reserve Lunch" description="Loading eligibility...">
        <p className="text-[#AEB6C2]">Checking cafeteria agreement status...</p>
      </ModuleShell>
    )
  }

  if (requiresSignature) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Reserve Lunch"
        description="A signed cafeteria agreement is required before lunch enrollment."
      >
        <Card className="rounded-[20px] border-[#D62828]/30 bg-[#D62828]/5 p-8">
          <p className="font-semibold text-[#041B52]">Cafeteria Agreement Required</p>
          <p className="mt-2 text-sm text-[#64748B]">
            You must sign the current Fuel The Dons cafeteria agreement before reserving meals.
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
        title="Reserve Lunch"
        description="Pre-order meals for students with a signed cafeteria agreement."
      >
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <p className="font-semibold text-[#041B52]">No students yet</p>
          <p className="mt-2 text-sm text-[#64748B]">
            No students are linked to your account. Ask your school administrator to import student
            records from Admin → Imports.
          </p>
        </Card>
      </ModuleShell>
    )
  }

  const blockingStudents = linkedStudents.filter((student) => {
    const profile = getStudentProfile(student.id, studentProfiles)
    const pending = getPendingSubmission(student.id, allergySubmissions)
    return isDietaryFormBlocking(profile, pending)
  })

  if (blockingStudents.length > 0) {
    return (
      <ModuleShell
        section="Parent Portal"
        title="Reserve Lunch"
        description="Complete dietary and allergy forms before reserving meals."
      >
        <Card className="rounded-[20px] border-[#D62828]/30 bg-[#D62828]/5 p-8">
          <p className="font-semibold text-[#041B52]">Dietary &amp; Food Allergy Form Required</p>
          <p className="mt-2 text-sm text-[#64748B]">
            Each student needs a complete, current dietary and food allergy form before lunch
            reservations can proceed.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#041B52]">
            {blockingStudents.map((student) => {
              const profile = getStudentProfile(student.id, studentProfiles)
              const pending = getPendingSubmission(student.id, allergySubmissions)
              const status = getFoodProfileStatus(profile, pending)
              return (
                <li
                  key={student.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D62828]/20 bg-white px-4 py-3"
                >
                  <span className="font-medium">
                    {student.firstName} {student.lastName}
                  </span>
                  <span className="text-xs font-bold uppercase text-[#D62828]">
                    {getFoodProfileDisplayLabel(status)}
                  </span>
                </li>
              )
            })}
          </ul>
          <Button asChild className="mt-6">
            <Link href="/parent/student-profile">Update Dietary Forms</Link>
          </Button>
        </Card>
      </ModuleShell>
    )
  }

  return (
    <ModuleShell
      section="Parent Portal"
      title="Reserve Lunch"
      description="Pre-order meals from the published school calendar."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <h2 className="text-lg font-semibold text-[#041B52]">New Reservation</h2>
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
                      {date}
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
                    {option.label} ({formatCurrency(option.defaultPrice)})
                  </option>
                ))}
              </Select>
            </div>
            {error ? <p className="text-sm text-[#D62828]">{error}</p> : null}
            {message ? <p className="text-sm text-[#00A83E]">{message}</p> : null}
            <Button
              type="button"
              disabled={submitting || !selectedDate || menuDates.length === 0}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Saving..." : "Reserve Lunch"}
            </Button>
          </div>
        </Card>

        <Card className="rounded-[20px] border-[#AEB6C2]/60 p-8">
          <h2 className="text-lg font-semibold text-[#041B52]">Your Reservations</h2>
          {reservations.length === 0 ? (
            <p className="mt-4 text-sm text-[#64748B]">No lunch reservations yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-[#AEB6C2]/40">
              {reservations.map((row) => (
                <li key={row.id} className="py-3 text-sm">
                  <p className="font-medium text-[#041B52]">
                    {row.studentName} — {row.date}
                  </p>
                  <p className="text-[#64748B]">
                    {row.mealType.replace(/_/g, " ")} · {formatCurrency(row.price)} · {row.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" className="mt-6">
            <Link href="/parent/calendar">View Meal Calendar</Link>
          </Button>
        </Card>
      </div>
    </ModuleShell>
  )
}
