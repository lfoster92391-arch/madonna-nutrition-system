"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { StudentLunchLiveActivityPanel } from "@/components/teacher/StudentLunchLiveActivityPanel"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/components/teacher/layout/teacher-theme"
import { formatCurrency } from "@/lib/utils"
import { STUDENT_MEAL_PRICE } from "@/lib/teacher/low-funds"
import type { TeacherPaymentMethod } from "@/lib/teacher/types"

export function StudentFoundPanel() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { selectedStudent, confirmStudentLunch } = useTeacherData()
  const [mealSelected, setMealSelected] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<TeacherPaymentMethod>("account")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activityRefreshToken, setActivityRefreshToken] = useState(0)

  if (!selectedStudent) {
    return (
      <Card
        className="flex min-h-[320px] items-center justify-center rounded-[20px] border p-6 shadow-sm"
        style={{ borderColor: "#AEB6C2" }}
      >
        <p className="text-sm text-silver-foreground">
          Search or select a student to assist with lunch signup.
        </p>
      </Card>
    )
  }

  async function handleConfirm() {
    if (!mealSelected || !selectedStudent) return
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await confirmStudentLunch(selectedStudent.id, paymentMethod)
      setActivityRefreshToken((n) => n + 1)
      void queryClient.invalidateQueries({
        queryKey: ["teacher-student-lunch-activity", selectedStudent.id, user?.id],
      })
      setMessage(
        `Signed ${selectedStudent.firstName} up for today’s main lunch. Kitchen counts and kiosk status are updated.`
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign up this student. Try again or use Sign up a student."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Student Found
      </h2>
      <div className="mt-4 flex gap-4">
        <Image
          src={selectedStudent.photo}
          alt={selectedStudent.firstName}
          width={72}
          height={72}
          className="h-18 w-18 rounded-2xl object-cover"
        />
        <div>
          <p className="text-xl font-bold" style={{ color: TEACHER_NAVY }}>
            {selectedStudent.firstName} {selectedStudent.lastName}
          </p>
          <p className="text-sm text-silver-foreground">Grade {selectedStudent.grade}</p>
          <p className="text-sm text-silver-foreground">ID {selectedStudent.id}</p>
          {selectedStudent.homeroom ? (
            <p className="text-sm text-silver-foreground">Homeroom {selectedStudent.homeroom}</p>
          ) : null}
          {selectedStudent.counselor ? (
            <p className="text-sm text-silver-foreground">Counselor: {selectedStudent.counselor}</p>
          ) : null}
        </div>
      </div>

      {selectedStudent.lowFunds ? (
        <div className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3">
          <p className="flex items-center gap-2 font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" />
            Low Funds
          </p>
          <p className="mt-1 text-sm text-silver-foreground">
            Account may require payment. Student can:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-silver-foreground">
            <li>Add funds online</li>
            <li>Pay at kiosk</li>
            <li>Ask parent to review account</li>
          </ul>
        </div>
      ) : null}

      <StudentLunchLiveActivityPanel
        studentId={selectedStudent.id}
        studentFirstName={selectedStudent.firstName}
        refreshToken={activityRefreshToken}
      />

      <div className="mt-4">
        <label
          className="flex cursor-pointer items-center gap-2 text-sm font-medium"
          style={{ color: TEACHER_NAVY }}
        >
          <input
            type="checkbox"
            checked={mealSelected}
            onChange={(e) => setMealSelected(e.target.checked)}
            className="h-4 w-4 rounded accent-[#041B52]"
          />
          Today’s student meal ({formatCurrency(STUDENT_MEAL_PRICE)})
        </label>
      </div>

      <fieldset className="mt-4 space-y-2">
        <legend className="text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
          Payment Method
        </legend>
        {(
          [
            ["account", "Use Account Funds (if available)"],
            ["prepay_online", "Prepay Online"],
            ["pay_at_kiosk", "Pay At Kiosk"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2 text-sm"
            style={{ color: TEACHER_NAVY }}
          >
            <input
              type="radio"
              name="student-payment"
              checked={paymentMethod === value}
              onChange={() => setPaymentMethod(value)}
              className="accent-[#041B52]"
            />
            {label}
            {value === "account" && selectedStudent.lowFunds ? (
              <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                Low Funds
              </span>
            ) : null}
          </label>
        ))}
      </fieldset>

      {error ? <p className="mt-3 text-sm text-[#D62828]">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-[#00A83E]">{message}</p> : null}

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={!mealSelected || submitting}
        onClick={() => void handleConfirm()}
      >
        Confirm lunch for {selectedStudent.firstName} (today)
      </Button>

      <p className="mt-4 text-center text-sm text-silver-foreground">
        Need more days or sides?{" "}
        <Link
          href="/teacher/sign-up-student"
          className="font-semibold underline"
          style={{ color: TEACHER_NAVY }}
        >
          Sign up a student for lunch
        </Link>
      </p>
    </Card>
  )
}
