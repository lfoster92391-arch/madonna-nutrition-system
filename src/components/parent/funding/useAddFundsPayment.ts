"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { api } from "@/lib/api/client"
import type { Student } from "@/lib/types"
import {
  ADD_FUNDS_MAX,
  ADD_FUNDS_MIN,
} from "@/lib/payments/schemas"

const LOW_BALANCE_TARGET = 25

export function getSuggestedDeposit(students: Pick<Student, "balance">[]): number {
  const lowBalance = students.filter((s) => s.balance < 5)
  if (lowBalance.length === 0) return 0
  const deficit = lowBalance.reduce(
    (sum, s) => sum + Math.max(0, LOW_BALANCE_TARGET - s.balance),
    0
  )
  return Math.ceil(deficit)
}

export function useAddFundsPayment(initialStudentId?: string) {
  const { user } = useAuth()
  const { students, users, transactions, addFunds } = useDemo()

  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId ?? "")
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(25)
  const [customAmount, setCustomAmount] = useState("")
  const [savePaymentMethod, setSavePaymentMethod] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoSuccess, setDemoSuccess] = useState(false)

  useEffect(() => {
    api
      .getConfig()
      .then((config) => setStripeConfigured(config.stripeConfigured))
      .catch(() => setStripeConfigured(false))
  }, [])

  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId)
    }
  }, [initialStudentId])

  const linkedStudents = useMemo(() => {
    if (!user) return []
    const demoUser = users.find((u) => u.id === user.id)
    const ids = new Set(demoUser?.linkedStudentIds ?? [])
    return students.filter((s) => ids.has(s.id) && !s.disabled)
  }, [user, users, students])

  useEffect(() => {
    if (linkedStudents.length && !selectedStudentId) {
      setSelectedStudentId(linkedStudents[0].id)
    }
  }, [linkedStudents, selectedStudentId])

  const amountDollars = useMemo(() => {
    if (selectedAmount === "custom") {
      const parsed = Number.parseFloat(customAmount)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return selectedAmount
  }, [selectedAmount, customAmount])

  const amountValid =
    amountDollars >= ADD_FUNDS_MIN && amountDollars <= ADD_FUNDS_MAX

  const selectedStudent = linkedStudents.find((s) => s.id === selectedStudentId)

  const depositHistory = useMemo(() => {
    if (!selectedStudentId) return []
    return transactions
      .filter((tx) => tx.type === "deposit" && tx.studentId === selectedStudentId)
      .slice(0, 5)
  }, [transactions, selectedStudentId])

  const handlePay = useCallback(async () => {
    if (!user || !selectedStudentId) return
    setError(null)
    setDemoSuccess(false)

    if (!amountValid) {
      setError(`Enter an amount between $${ADD_FUNDS_MIN} and $${ADD_FUNDS_MAX}.`)
      return
    }

    setSubmitting(true)
    try {
      if (stripeConfigured) {
        const { url } = await api.createCheckoutSession(
          selectedStudentId,
          user.id,
          amountDollars
        )
        window.location.href = url
        return
      }

      const tx = await addFunds(selectedStudentId, amountDollars, user.displayName)
      if (!tx) {
        setError("Unable to add funds for this student.")
        return
      }
      setDemoSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be started.")
    } finally {
      setSubmitting(false)
    }
  }, [
    user,
    selectedStudentId,
    amountValid,
    amountDollars,
    stripeConfigured,
    addFunds,
  ])

  const resetForm = useCallback(() => {
    setSelectedAmount(25)
    setCustomAmount("")
    setSavePaymentMethod(false)
    setError(null)
    setDemoSuccess(false)
  }, [])

  return {
    stripeConfigured,
    linkedStudents,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    savePaymentMethod,
    setSavePaymentMethod,
    amountDollars,
    amountValid,
    depositHistory,
    submitting,
    error,
    demoSuccess,
    handlePay,
    resetForm,
  }
}
