"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"
import { formatCurrency } from "@/lib/utils"
import { STUDENT_MEAL_PRICE } from "@/lib/teacher/low-funds"
import type { TeacherPaymentMethod } from "@/lib/teacher/types"

export function StudentFoundPanel() {
  const { selectedStudent, confirmStudentLunch } = useTeacherData()
  const [mealSelected, setMealSelected] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<TeacherPaymentMethod>("account")
  const [submitting, setSubmitting] = useState(false)

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
    try {
      await confirmStudentLunch(selectedStudent.id, paymentMethod)
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

      <div className="mt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium" style={{ color: TEACHER_NAVY }}>
          <input
            type="checkbox"
            checked={mealSelected}
            onChange={(e) => setMealSelected(e.target.checked)}
            className="h-4 w-4 rounded accent-[#041B52]"
          />
          Student Meal ({formatCurrency(STUDENT_MEAL_PRICE)})
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

      <Button
        className="mt-6 w-full"
        size="lg"
        disabled={!mealSelected || submitting}
        onClick={handleConfirm}
      >
        Confirm Lunch for {selectedStudent.firstName}
      </Button>
    </Card>
  )
}
