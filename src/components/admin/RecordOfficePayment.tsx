"use client"

import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, DollarSign } from "lucide-react"
import { api } from "@/lib/api/client"
import { formatCurrency } from "@/lib/utils"
import type { Student } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type PaymentMethod = "cash" | "check" | "card" | "other"

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
  onDone,
}: {
  students: Student[]
  initialStudentId?: string
  compact?: boolean
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
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selected = activeStudents.find((s) => s.id === studentId)

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

    setBusy(true)
    try {
      const result = await api.recordOfficePayment({
        studentId,
        amount: dollars,
        method,
        note: note.trim() || undefined,
      })
      const balanceAfter =
        typeof result.balanceAfter === "number" ? result.balanceAfter : (selected?.balance ?? 0) + dollars
      setSuccess(
        `Payment recorded. ${selected?.firstName ?? "Student"} now has ${formatCurrency(balanceAfter)}.`
      )
      setAmount("")
      setNote("")
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      onDone?.(balanceAfter)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment. Try again.")
    } finally {
      setBusy(false)
    }
  }

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
            }}
          >
            <option value="">Choose a student…</option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName}, {s.firstName} ({s.id}) — {formatCurrency(s.balance)}
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
          <strong className="tabular-nums">{formatCurrency(selected.balance)}</strong>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="office-pay-amount">Amount paid ($)</Label>
          <Input
            id="office-pay-amount"
            inputMode="decimal"
            placeholder="25.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoComplete="off"
          />
        </div>
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
      </div>

      <div>
        <Label htmlFor="office-pay-note">Note (optional)</Label>
        <Textarea
          id="office-pay-note"
          placeholder="Check #1234, receipt, etc."
          value={note}
          onChange={(e) => setNote(e.target.value)}
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

      <Button type="submit" size="lg" className="min-h-12 w-full text-base sm:w-auto" disabled={busy}>
        <DollarSign className="h-4 w-4" />
        {busy ? "Saving…" : "Add money to account"}
      </Button>
    </form>
  )

  if (compact) return form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add money to account</CardTitle>
        <p className="text-sm text-silver-foreground">
          Use this when a family pays in the school office. The money goes on the student&apos;s
          lunch account right away.
        </p>
      </CardHeader>
      <div className="px-6 pb-6">{form}</div>
    </Card>
  )
}
