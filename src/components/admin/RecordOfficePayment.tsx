"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, DollarSign, Minus } from "lucide-react"
import { api } from "@/lib/api/client"
import { cn, formatCurrency } from "@/lib/utils"
import type { Student } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type PaymentMethod = "cash" | "check" | "card" | "other"
type FundsAction = "add" | "subtract"

const METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "card", label: "Card (office terminal)" },
  { value: "other", label: "Other" },
]

export function RecordOfficePayment({
  students,
  initialStudentId,
  compact = false,
  initialAction = "add",
  onDone,
}: {
  students: Student[]
  initialStudentId?: string
  compact?: boolean
  initialAction?: FundsAction
  onDone?: (balanceAfter: number) => void
}) {
  const queryClient = useQueryClient()
  const activeStudents = useMemo(
    () =>
      students
        .filter((s) => !s.disabled)
        .slice()
        .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)),
    [students]
  )

  const [studentId, setStudentId] = useState(initialStudentId ?? "")
  const [action, setAction] = useState<FundsAction>(initialAction)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [localBalances, setLocalBalances] = useState<Record<string, number>>({})

  const selected = activeStudents.find((s) => s.id === studentId)
  const currentBalance = studentId
    ? (localBalances[studentId] ?? selected?.balance ?? 0)
    : (selected?.balance ?? 0)

  function switchAction(next: FundsAction) {
    setAction(next)
    setConfirming(false)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const dollars = Number.parseFloat(amount)
    if (!studentId) {
      setError("Choose a student first.")
      return
    }
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter an amount greater than $0.")
      return
    }

    if (action === "subtract") {
      if (currentBalance <= 0) {
        setError("Nothing to take off. Balance is already $0 or less.")
        return
      }
      if (!confirming) {
        setConfirming(true)
        return
      }
    }

    setBusy(true)
    try {
      const result = await api.recordOfficePayment({
        studentId,
        amount: dollars,
        method: action === "add" ? method : undefined,
        note: note.trim() || undefined,
        action,
      })
      const balanceAfter =
        typeof result.balanceAfter === "number"
          ? result.balanceAfter
          : action === "add"
            ? currentBalance + dollars
            : Math.max(0, currentBalance - dollars)
      const takenOff =
        typeof result.amountDebited === "number" ? result.amountDebited : Math.min(dollars, currentBalance)

      setLocalBalances((prev) => ({ ...prev, [studentId]: balanceAfter }))
      if (action === "subtract") {
        const clampedNote =
          takenOff < dollars
            ? ` Took ${formatCurrency(takenOff)} off (cannot go below $0).`
            : ""
        setSuccess(
          `Took ${formatCurrency(takenOff)} off. ${selected?.firstName ?? "Student"} now has ${formatCurrency(balanceAfter)}.${clampedNote}`
        )
      } else {
        setSuccess(
          `Payment recorded. ${selected?.firstName ?? "Student"} now has ${formatCurrency(balanceAfter)}.`
        )
      }
      setAmount("")
      setNote("")
      setConfirming(false)
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      onDone?.(balanceAfter)
    } catch (err) {
      setConfirming(false)
      setError(err instanceof Error ? err.message : "Could not update the lunch account. Try again.")
    } finally {
      setBusy(false)
    }
  }

  const dollarsPreview = Number.parseFloat(amount)
  const takeOffAmount =
    Number.isFinite(dollarsPreview) && dollarsPreview > 0
      ? Math.min(dollarsPreview, Math.max(0, currentBalance))
      : 0
  const balanceAfterPreview = Math.max(0, currentBalance - takeOffAmount)

  const form = (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {!initialStudentId && (
        <div>
          <Label htmlFor="office-pay-student">Student</Label>
          <Select
            id="office-pay-student"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              setSuccess(null)
              setError(null)
              setConfirming(false)
            }}
          >
            <option value="">Choose a student…</option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName}, {s.firstName} ({s.id}) — {formatCurrency(localBalances[s.id] ?? s.balance)}
              </option>
            ))}
          </Select>
          {activeStudents.length === 0 && (
            <p className="mt-2 text-sm text-silver-foreground">
              No students yet. Import or add students first.
            </p>
          )}
        </div>
      )}

      {selected && (
        <p className="rounded-xl bg-silver/20 px-4 py-3 text-sm text-primary">
          Current balance for {selected.firstName} {selected.lastName}:{" "}
          <strong className="tabular-nums">{formatCurrency(currentBalance)}</strong>
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(
            "min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-semibold",
            action === "add"
              ? "border-primary bg-primary text-white"
              : "border-silver bg-white text-primary"
          )}
          onClick={() => switchAction("add")}
        >
          Add money
        </button>
        <button
          type="button"
          className={cn(
            "min-h-11 rounded-xl border-2 px-3 py-2 text-sm font-semibold",
            action === "subtract"
              ? "border-primary bg-primary text-white"
              : "border-silver bg-white text-primary"
          )}
          onClick={() => switchAction("subtract")}
        >
          Take money off
        </button>
      </div>

      {action === "subtract" && (
        <p className="text-sm text-silver-foreground">
          Use this for a correction, refund, or typing mistake. This is not a lunch charge. The
          account will not go below $0.
        </p>
      )}

      <div className={cn("grid gap-4", action === "add" ? "sm:grid-cols-2" : "")}>
        <div>
          <Label htmlFor="office-pay-amount">
            {action === "add" ? "Amount paid ($)" : "Amount to take off ($)"}
          </Label>
          <Input
            id="office-pay-amount"
            inputMode="decimal"
            placeholder="25.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              setConfirming(false)
            }}
            autoComplete="off"
          />
        </div>
        {action === "add" && (
          <div>
            <Label htmlFor="office-pay-method">How did they pay?</Label>
            <Select
              id="office-pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="office-pay-note">Note (optional)</Label>
        <Textarea
          id="office-pay-note"
          placeholder={
            action === "add"
              ? "Check #1234, receipt, etc."
              : "Why you are taking money off — refund, duplicate deposit, etc."
          }
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setConfirming(false)
          }}
          rows={2}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p
          className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </p>
      )}

      {action === "subtract" && confirming ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-950">
            Take {formatCurrency(takeOffAmount)} off {selected?.firstName ?? "this student"}&apos;s
            lunch account? New balance will be {formatCurrency(balanceAfterPreview)}. This is a
            correction, not a meal charge.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Back
            </Button>
            <Button type="submit" size="lg" className="min-h-12" disabled={busy}>
              <Minus className="h-4 w-4" />
              {busy ? "Saving…" : "Confirm take money off"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="submit" size="lg" className="min-h-12 w-full text-base sm:w-auto" disabled={busy}>
          {action === "add" ? <DollarSign className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          {busy
            ? "Saving…"
            : action === "add"
              ? "Add money to account"
              : "Take money off"}
        </Button>
      )}
    </form>
  )

  if (compact) return form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add or take money off</CardTitle>
        <p className="text-sm text-silver-foreground">
          Add money when a family pays in the office. Take money off for a correction, refund, or
          mistake. Parent card payments still go through Stripe.
        </p>
      </CardHeader>
      <div className="px-6 pb-6">{form}</div>
    </Card>
  )
}
