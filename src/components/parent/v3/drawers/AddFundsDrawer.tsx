"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { QuickAmountPicker } from "@/components/parent/funding/QuickAmountPicker"
import { useAddFundsPayment } from "@/components/parent/funding/useAddFundsPayment"
import { ParentDrawerShell } from "@/components/parent/v3/ParentDrawerShell"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { V3_NAVY } from "@/components/parent/v3/parent-v3-theme"

type AddFundsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStudentId?: string
}

export function AddFundsDrawer({ open, onOpenChange, initialStudentId }: AddFundsDrawerProps) {
  const [step, setStep] = useState<"student" | "amount" | "complete">("student")
  const {
    stripeConfigured,
    linkedStudents,
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    amountValid,
    depositHistory,
    submitting,
    error,
    demoSuccess,
    handlePay,
    resetForm,
  } = useAddFundsPayment(initialStudentId)

  useEffect(() => {
    if (!open) {
      resetForm()
      setStep(initialStudentId ? "amount" : "student")
      return
    }
    if (initialStudentId) {
      setSelectedStudentId(initialStudentId)
      setStep("amount")
    } else if (linkedStudents.length === 1) {
      setSelectedStudentId(linkedStudents[0].id)
      setStep("amount")
    } else {
      setStep("student")
    }
  }, [open, initialStudentId, linkedStudents, resetForm, setSelectedStudentId])

  useEffect(() => {
    if (demoSuccess) {
      setStep("complete")
    }
  }, [demoSuccess])

  const balance = selectedStudent?.balance ?? 0
  const studentName = selectedStudent
    ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
    : "Student"

  return (
    <ParentDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Funds"
      description="Choose a student, pick an amount, and complete secure checkout."
    >
      {step === "student" && (
        <div className="space-y-4">
          <p className="text-sm text-[#64748B]">Which student account should receive the deposit?</p>
          <ul className="space-y-3">
            {linkedStudents.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(student.id)
                    setStep("amount")
                  }}
                  className="flex w-full items-center justify-between rounded-[16px] border border-[#C7CCD6] px-4 py-4 text-left transition hover:border-[#041B52]/30 hover:bg-[#041B52]/[0.02]"
                >
                  <span>
                    <span className="block font-semibold" style={{ color: V3_NAVY }}>
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-sm text-[#64748B]">Grade {student.grade}</span>
                  </span>
                  <span
                    className="text-lg font-bold tabular-nums"
                    style={{ color: student.balance < 5 ? "#EA580C" : "#16A34A" }}
                  >
                    {formatCurrency(student.balance)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step === "amount" && selectedStudent && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => {
              if (linkedStudents.length > 1) setStep("student")
            }}
            className="text-sm font-semibold text-[#64748B] hover:text-[#041B52]"
          >
            {linkedStudents.length > 1 ? "← Change student" : null}
          </button>

          <div className="rounded-[16px] border border-[#C7CCD6] bg-[#041B52]/[0.02] px-4 py-3">
            <p className="text-sm font-medium text-[#64748B]">{studentName}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: V3_NAVY }}>
              {formatCurrency(balance)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold" style={{ color: V3_NAVY }}>
              Amount
            </p>
            <QuickAmountPicker
              selectedAmount={selectedAmount}
              onSelectAmount={setSelectedAmount}
              customAmount={customAmount}
              onCustomAmountChange={setCustomAmount}
              compact
            />
          </div>

          <div className="rounded-[16px] border border-[#C7CCD6] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: V3_NAVY }}>
              <CreditCard className="h-4 w-4" />
              Secure checkout
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              {stripeConfigured
                ? "Pay with card via Stripe. Card details are not stored on our servers."
                : "Demo mode — no card required."}
            </p>
          </div>

          {depositHistory.length > 0 && (
            <div>
              <p className="text-sm font-semibold" style={{ color: V3_NAVY }}>
                Recent deposits
              </p>
              <ul className="mt-2 space-y-2">
                {depositHistory.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-bold tabular-nums text-[#16A34A]">
                      +{formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm font-medium text-danger">{error}</p>}

          <Button
            type="button"
            className="h-11 w-full rounded-[12px]"
            disabled={submitting || !amountValid}
            onClick={() => void handlePay()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {stripeConfigured ? "Continue to Checkout" : "Add Funds (Demo)"}
              </>
            )}
          </Button>
        </div>
      )}

      {step === "complete" && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-[#16A34A]" />
          <div>
            <p className="text-lg font-bold" style={{ color: V3_NAVY }}>
              Deposit complete
            </p>
            <p className="mt-2 text-sm text-[#64748B]">
              Funds were added to {studentName}&apos;s account.
            </p>
          </div>
          <Button
            type="button"
            className="h-11 rounded-[12px] px-8"
            style={{ backgroundColor: V3_NAVY }}
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      )}
    </ParentDrawerShell>
  )
}
