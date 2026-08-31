"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, DollarSign, Minus } from "lucide-react"
import { api } from "@/lib/api/client"
import { syncBalanceCaches } from "@/lib/client/sync-balance-caches"
import { cn, formatCurrency } from "@/lib/utils"
import { formatUserName } from "@/lib/users"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
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

export function RecordStaffOfficePayment({
  staffUser,
  initialAction = "add",
  onDone,
}: {
  staffUser: User
  initialAction?: FundsAction
  onDone?: (balanceAfter: number) => void
}) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState<FundsAction>(initialAction)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [balance, setBalance] = useState(staffUser.accountBalance ?? 0)

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
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Enter an amount greater than $0.")
      return
    }

    if (action === "subtract") {
      if (!confirming) {
        setConfirming(true)
        return
      }
    }

    setBusy(true)
    try {
      const result = await api.recordStaffOfficePayment({
        userId: staffUser.id,
        amount: dollars,
        method: action === "add" ? method : undefined,
        note: note.trim() || undefined,
        action,
        allowNegative: action === "subtract" ? true : undefined,
      })
      const balanceAfter =
        typeof result.balanceAfter === "number"
          ? result.balanceAfter
          : action === "add"
            ? balance + dollars
            : balance - dollars
      const takenOff =
        typeof result.amountDebited === "number" ? result.amountDebited : dollars
      setBalance(balanceAfter)
      if (action === "subtract") {
        const debtNote =
          balanceAfter < 0 ? " Account is now in debt (negative balance)." : ""
        setSuccess(
          `Took ${formatCurrency(takenOff)} off. ${formatUserName(staffUser)} now has ${formatCurrency(balanceAfter)} on their lunch account.${debtNote}`
        )
      } else {
        setSuccess(
          `Payment recorded. ${formatUserName(staffUser)} now has ${formatCurrency(balanceAfter)} on their lunch account.`
        )
      }
      setAmount("")
      setNote("")
      setConfirming(false)
      await syncBalanceCaches(queryClient, {
        staffUserId: staffUser.id,
        staffBalanceAfter: balanceAfter,
      })
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
    Number.isFinite(dollarsPreview) && dollarsPreview > 0 ? dollarsPreview : 0
  const balanceAfterPreview = balance - takeOffAmount
  const willEnterDebt = action === "subtract" && takeOffAmount > 0 && balanceAfterPreview < 0

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <p className="rounded-xl bg-silver/20 px-4 py-3 text-sm text-primary">
        Current lunch balance for {formatUserName(staffUser)}:{" "}
        <strong className="tabular-nums">{formatCurrency(balance)}</strong>
      </p>

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
          Use this for a correction, refund, or unpaid meal. Balance may go below $0 (debt). This is
          not a lunch-line charge.
        </p>
      )}

      <div className={cn("grid gap-4", action === "add" ? "sm:grid-cols-2" : "")}>
        <div>
          <Label htmlFor="staff-pay-amount">
            {action === "add" ? "Amount paid ($)" : "Amount to take off ($)"}
          </Label>
          <Input
            id="staff-pay-amount"
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
            <Label htmlFor="staff-pay-method">How did they pay?</Label>
            <Select
              id="staff-pay-method"
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
        <Label htmlFor="staff-pay-note">Note (optional)</Label>
        <Textarea
          id="staff-pay-note"
          placeholder={
            action === "add"
              ? "Check #1234, receipt, etc."
              : "Why you are taking money off — unpaid meal, refund, etc."
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
        <div
          className={cn(
            "space-y-3 rounded-xl border px-4 py-3",
            willEnterDebt ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
          )}
        >
          <p className={cn("text-sm", willEnterDebt ? "text-red-950" : "text-amber-950")}>
            Take {formatCurrency(takeOffAmount)} off {formatUserName(staffUser)}&apos;s lunch
            account? New balance will be {formatCurrency(balanceAfterPreview)}.
            {willEnterDebt
              ? " That puts the account in debt."
              : " This is a correction, not a meal charge."}
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
              ? "Add money to staff account"
              : "Take money off"}
        </Button>
      )}
    </form>
  )
}
