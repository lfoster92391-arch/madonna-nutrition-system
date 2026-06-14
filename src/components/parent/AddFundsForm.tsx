"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { api } from "@/lib/api/client"
import {
  ADD_FUNDS_MAX,
  ADD_FUNDS_MIN,
  PRESET_AMOUNTS,
} from "@/lib/payments/schemas"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export function AddFundsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { students, users, transactions, addFunds, databaseEnabled, isLoading } = useDemo()

  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(25)
  const [customAmount, setCustomAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoSuccess, setDemoSuccess] = useState(false)

  const success = searchParams.get("success") === "1"
  const canceled = searchParams.get("canceled") === "1"

  useEffect(() => {
    api
      .getConfig()
      .then((config) => setStripeConfigured(config.stripeConfigured))
      .catch(() => setStripeConfigured(false))
  }, [])

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

  const depositHistory = useMemo(() => {
    if (!user) return []
    const ids = new Set(
      users.find((u) => u.id === user.id)?.linkedStudentIds ?? []
    )
    return transactions
      .filter((tx) => tx.type === "deposit" && ids.has(tx.studentId))
      .slice(0, 10)
  }, [transactions, user, users])

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

  useEffect(() => {
    if (success && databaseEnabled) {
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      router.replace("/parent/add-funds")
    }
  }, [success, databaseEnabled, router, queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {DEMO_SCHOOL.name} · {DEMO_SCHOOL.location}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-primary">Add Funds</h1>
        <p className="mt-2 max-w-2xl text-silver-foreground">
          Prepay cafeteria meals for your student. Funds are applied to their account balance
          after payment is confirmed.
        </p>
      </div>

      {success && (
        <Card className="flex items-start gap-3 rounded-[20px] border-success/30 bg-success/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-primary">Payment successful</p>
            <p className="text-sm text-silver-foreground">
              Your deposit is being applied. Balances update shortly after Stripe confirms
              payment.
            </p>
          </div>
        </Card>
      )}

      {canceled && (
        <Card className="flex items-start gap-3 rounded-[20px] border-amber-500/30 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-primary">Payment canceled</p>
            <p className="text-sm text-silver-foreground">No charge was made.</p>
          </div>
        </Card>
      )}

      {demoSuccess && !stripeConfigured && (
        <Card className="flex items-start gap-3 rounded-[20px] border-success/30 bg-success/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-primary">Demo deposit applied</p>
            <p className="text-sm text-silver-foreground">
              This is a simulated payment for local development. Connect Stripe keys in production
              for real card payments.
            </p>
          </div>
        </Card>
      )}

      {stripeConfigured === false && (
        <Card className="rounded-[20px] border-amber-500/30 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Payments not configured</p>
          <p className="mt-1 text-sm text-amber-800">
            Stripe keys are not set. Use the demo deposit button below to simulate adding funds
            locally.
          </p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Select student</h2>
          <div className="mt-4 space-y-2">
            {linkedStudents.map((student) => (
              <label
                key={student.id}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                  selectedStudentId === student.id
                    ? "border-primary bg-primary/5"
                    : "border-silver/50 hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="student"
                    checked={selectedStudentId === student.id}
                    onChange={() => setSelectedStudentId(student.id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <div>
                    <p className="font-semibold text-primary">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-silver-foreground">Grade {student.grade}</p>
                  </div>
                </div>
                <p className="font-bold tabular-nums text-primary">
                  {formatCurrency(student.balance)}
                </p>
              </label>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold text-primary">Amount</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESET_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setSelectedAmount(amount)}
                className={`rounded-2xl border px-4 py-3 text-center font-bold transition ${
                  selectedAmount === amount
                    ? "border-primary bg-primary text-white"
                    : "border-silver/50 text-primary hover:border-primary/40"
                }`}
              >
                ${amount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedAmount("custom")}
              className={`rounded-2xl border px-4 py-3 text-center font-bold transition ${
                selectedAmount === "custom"
                  ? "border-primary bg-primary text-white"
                  : "border-silver/50 text-primary hover:border-primary/40"
              }`}
            >
              Custom
            </button>
          </div>

          {selectedAmount === "custom" && (
            <div className="mt-4">
              <label htmlFor="custom-amount" className="text-sm font-medium text-primary">
                Custom amount (${ADD_FUNDS_MIN}–${ADD_FUNDS_MAX})
              </label>
              <Input
                id="custom-amount"
                type="number"
                min={ADD_FUNDS_MIN}
                max={ADD_FUNDS_MAX}
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-2 max-w-xs"
              />
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm font-medium text-danger">{error}</p>
          )}

          <Button
            type="button"
            className="mt-6 w-full sm:w-auto"
            disabled={submitting || !selectedStudentId || !amountValid}
            onClick={() => void handlePay()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {stripeConfigured ? "Pay with Card" : "Add Funds (Demo)"}
              </>
            )}
          </Button>
        </Card>

        <Card className="rounded-[20px] border-silver/60 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">Payment history</h2>
          <p className="mt-1 text-sm text-silver-foreground">Recent card deposits</p>
          {depositHistory.length === 0 ? (
            <p className="mt-6 text-sm text-silver-foreground">No deposits yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {depositHistory.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-center justify-between border-b border-silver/30 pb-3 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-primary">{tx.studentName}</p>
                    <p className="text-silver-foreground">
                      {new Date(tx.timestamp).toLocaleDateString()} · {tx.meal}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums text-success">
                    +{formatCurrency(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
