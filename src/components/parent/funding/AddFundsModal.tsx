"use client"

import { useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react"
import { QuickAmountPicker } from "@/components/parent/funding/QuickAmountPicker"
import { useAddFundsPayment } from "@/components/parent/funding/useAddFundsPayment"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"

type AddFundsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
  balance: number
}

export function AddFundsModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  balance,
}: AddFundsModalProps) {
  const {
    stripeConfigured,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    amountValid,
    depositHistory,
    submitting,
    error,
    demoSuccess,
    savePaymentMethod,
    setSavePaymentMethod,
    handlePay,
    resetForm,
  } = useAddFundsPayment(studentId)

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open, resetForm])

  const isLowBalance = balance < 5

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            Deposit to {studentName}&apos;s cafeteria account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-silver/50 bg-silver/5 px-4 py-3">
            <p className="text-sm font-medium text-silver-foreground">Current balance</p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${
                isLowBalance ? "text-danger" : "text-success"
              }`}
            >
              {formatCurrency(balance)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-primary">Amount</p>
            <QuickAmountPicker
              selectedAmount={selectedAmount}
              onSelectAmount={setSelectedAmount}
              customAmount={customAmount}
              onCustomAmountChange={setCustomAmount}
              compact
            />
          </div>

          <div className="rounded-2xl border border-silver/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <CreditCard className="h-4 w-4" />
              Secure checkout
            </div>
            <p className="mt-1 text-sm text-silver-foreground">
              {stripeConfigured
                ? "Pay with card via Stripe - we never store your full card number."
                : "Demo mode - no card required"}
            </p>
            <Link
              href="/parent/payments?tab=billing"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Billing & payment preferences
            </Link>
          </div>

          <CheckboxField
            id="save-payment-method-modal"
            label="Save payment method for faster checkout"
            description="Optional. Only masked details (e.g. Visa **** 4242) are shown if you opt in."
            checked={savePaymentMethod}
            onCheckedChange={setSavePaymentMethod}
            className="min-h-0 rounded-[14px]"
          />

          {depositHistory.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-primary">Recent deposits</p>
              <ul className="mt-2 space-y-2">
                {depositHistory.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-silver-foreground">
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

          {demoSuccess && !stripeConfigured && (
            <div className="flex items-start gap-2 rounded-2xl border border-success/30 bg-success/5 p-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <p className="text-silver-foreground">Demo deposit applied successfully.</p>
            </div>
          )}

          {error && <p className="text-sm font-medium text-danger">{error}</p>}

          <Button
            type="button"
            className="w-full"
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
                {stripeConfigured ? "Add Funds" : "Add Funds (Demo)"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
