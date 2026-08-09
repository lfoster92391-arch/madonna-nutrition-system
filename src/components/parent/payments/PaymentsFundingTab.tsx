"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { QuickAmountPicker } from "@/components/parent/funding/QuickAmountPicker"
import {
  getSuggestedDeposit,
  useAddFundsPayment,
} from "@/components/parent/funding/useAddFundsPayment"
import { useDemo } from "@/components/providers/DemoProvider"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/utils"
import { CARD_SAFETY_COPY } from "@/lib/security/card-copy"

export function PaymentsFundingTab() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { databaseEnabled, isLoading } = useDemo()

  const success = searchParams.get("success") === "1"
  const canceled = searchParams.get("canceled") === "1"

  const studentFromUrl = searchParams.get("student") ?? undefined
  const payment = useAddFundsPayment(studentFromUrl)
  const suggestedDeposit = getSuggestedDeposit(payment.linkedStudents)
  const familyBalance = payment.linkedStudents.reduce((sum, s) => sum + s.balance, 0)

  useEffect(() => {
    if (success && databaseEnabled) {
      void queryClient.invalidateQueries({ queryKey: ["students"] })
      void queryClient.invalidateQueries({ queryKey: ["transactions"] })
      router.replace("/parent/payments?tab=funding")
    }
  }, [success, databaseEnabled, router, queryClient])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className={`${PARENT_CARD} flex items-start gap-3 border-success/30 bg-success/5 p-4`}>
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">Payment successful</p>
            <p className="mt-1 text-sm text-[#64748B]">
              Funds have been added to the student account.
            </p>
          </div>
        </div>
      )}

      {canceled && (
        <div className={`${PARENT_CARD} flex items-start gap-3 border-warning/30 bg-warning/5 p-4`}>
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="font-semibold text-warning">Checkout canceled</p>
            <p className="mt-1 text-sm text-[#64748B]">No charge was made.</p>
          </div>
        </div>
      )}

      {payment.demoSuccess && (
        <div className={`${PARENT_CARD} flex items-start gap-3 border-success/30 bg-success/5 p-4`}>
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="font-semibold text-success">Deposit complete</p>
            <p className="mt-1 text-sm text-[#64748B]">
              {formatCurrency(payment.amountDollars)} added to{" "}
              {payment.selectedStudent
                ? `${payment.selectedStudent.firstName} ${payment.selectedStudent.lastName}`
                : "the student account"}
              .
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${PARENT_CARD} space-y-4 p-4 md:p-5`}>
          <div>
            <h2 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
              Add Funds
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Select a student, choose an amount, and complete secure checkout.
            </p>
            <p className="mt-2 text-sm text-[#64748B]">{CARD_SAFETY_COPY}</p>
          </div>

          <div>
            <Label htmlFor="funding-student">Student</Label>
            <Select
              id="funding-student"
              className="mt-1"
              value={payment.selectedStudentId}
              onChange={(e) => payment.setSelectedStudentId(e.target.value)}
            >
              {payment.linkedStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({formatCurrency(student.balance)})
                </option>
              ))}
            </Select>
          </div>

          {payment.selectedStudent && (
            <div className="rounded-[14px] border border-[#C8CDD7] bg-[#041B52]/[0.02] px-4 py-3">
              <p className="text-sm text-[#64748B]">Current balance</p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: PARENT_NAVY }}>
                {formatCurrency(payment.selectedStudent.balance)}
              </p>
            </div>
          )}

          <div>
            <Label>Amount</Label>
            <div className="mt-1">
              <QuickAmountPicker
                selectedAmount={payment.selectedAmount}
                onSelectAmount={payment.setSelectedAmount}
                customAmount={payment.customAmount}
                onCustomAmountChange={payment.setCustomAmount}
              />
            </div>
          </div>

          {payment.error && <p className="text-sm font-medium text-danger">{payment.error}</p>}

          <Button
            type="button"
            className="h-11 w-full rounded-[12px]"
            style={{ backgroundColor: PARENT_NAVY }}
            disabled={payment.submitting || !payment.amountValid || !payment.selectedStudentId}
            onClick={() => void payment.handlePay()}
          >
            {payment.submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {payment.stripeConfigured ? "Continue to Checkout" : "Add Funds (Demo)"}
              </>
            )}
          </Button>
        </div>

        <div className={`${PARENT_CARD} space-y-4 p-4 md:p-5`}>
          <div>
            <h2 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
              Family Summary
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Combined balance across linked student accounts.
            </p>
          </div>
          <div>
            <p className="text-sm text-[#64748B]">Total family balance</p>
            <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: PARENT_NAVY }}>
              {formatCurrency(familyBalance)}
            </p>
          </div>
          {suggestedDeposit > 0 && (
            <div className="rounded-[14px] border border-[#C8CDD7] bg-[#041B52]/[0.02] px-4 py-3">
              <p className="text-sm font-semibold" style={{ color: PARENT_NAVY }}>
                Suggested deposit
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                One or more accounts are low. Consider adding{" "}
                <span className="font-bold text-success">{formatCurrency(suggestedDeposit)}</span>.
              </p>
            </div>
          )}
          {payment.depositHistory.length > 0 && (
            <div>
              <p className="text-sm font-semibold" style={{ color: PARENT_NAVY }}>
                Recent deposits
              </p>
              <ul className="mt-2 space-y-2">
                {payment.depositHistory.map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                    <span className="font-bold tabular-nums text-success">
                      +{formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
