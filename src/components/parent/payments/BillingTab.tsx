"use client"

import { useEffect, useState } from "react"
import { CreditCard, Wallet } from "lucide-react"
import { getSuggestedDeposit } from "@/components/parent/funding/useAddFundsPayment"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { CheckboxField } from "@/components/ui/checkbox"
import { Input, Label } from "@/components/ui/input"
import {
  getAutoReloadPrefs,
  setAutoReloadPrefs,
  type AutoReloadPrefs,
} from "@/lib/parent-balance-alerts"
import { formatCurrency } from "@/lib/utils"

type BillingTabProps = {
  onMakeDeposit: () => void
}

export function BillingTab({ onMakeDeposit }: BillingTabProps) {
  const { linkedStudents, isLoading } = useParentTransactions()
  const [autoReload, setAutoReload] = useState<AutoReloadPrefs>(getAutoReloadPrefs)

  useEffect(() => {
    setAutoReload(getAutoReloadPrefs())
  }, [])

  const familyBalance = linkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const lowBalanceStudents = linkedStudents.filter((s) => s.balance < 5)
  const suggestedDeposit = getSuggestedDeposit(linkedStudents)

  function updateAutoReload(patch: Partial<AutoReloadPrefs>) {
    const next = { ...autoReload, ...patch }
    setAutoReload(next)
    setAutoReloadPrefs(next)
  }

  if (isLoading) {
    return <p className="text-sm text-[#64748B]">Loading billing settings…</p>
  }

  return (
    <div className="space-y-4">
      <div className={`${PARENT_CARD} p-5 md:p-6`}>
        <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
          Billing Summary
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SummaryItem label="Current Family Balance" value={formatCurrency(familyBalance)} />
          <SummaryItem
            label="Students Needing Funds"
            value={lowBalanceStudents.length > 0 ? String(lowBalanceStudents.length) : "None"}
            highlight={lowBalanceStudents.length > 0}
          />
          <SummaryItem
            label="Deposit Preferences"
            value={autoReload.enabled ? "Auto-reload on" : "One-time deposits"}
          />
        </div>
        {suggestedDeposit > 0 && (
          <p className="mt-4 text-sm text-[#64748B]">
            Suggested deposit: {formatCurrency(suggestedDeposit)} to cover low balances.
          </p>
        )}
        <Button
          type="button"
          className="mt-4 rounded-[10px]"
          style={{ backgroundColor: PARENT_NAVY }}
          onClick={onMakeDeposit}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Make Deposit
        </Button>
      </div>

      <div className={`${PARENT_CARD} p-5 md:p-6`}>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Saved Payment Methods
          </h3>
        </div>
        <p className="mt-2 text-sm text-[#64748B]">
          Payment methods are managed securely at checkout. Use the funding tab to add funds with
          your saved card.
        </p>
      </div>

      <div className={`${PARENT_CARD} space-y-4 p-5 md:p-6`}>
        <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
          Auto Reload
        </h3>
        <p className="text-sm text-[#64748B]">
          Optionally add funds when balances drop below your threshold.
        </p>
        <CheckboxField
          id="billing-auto-reload"
          label="Enable Auto Reload"
          description={`When balance falls below ${formatCurrency(autoReload.triggerAmount)}, deposit ${formatCurrency(autoReload.depositAmount)}.`}
          checked={autoReload.enabled}
          onChange={(enabled) => updateAutoReload({ enabled })}
        />
        {autoReload.enabled && (
          <div className="grid gap-4 rounded-[14px] border border-[#C8CDD7] p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-trigger-amount">Trigger amount</Label>
              <Input
                id="billing-trigger-amount"
                type="number"
                min={1}
                step={1}
                value={autoReload.triggerAmount}
                onChange={(e) =>
                  updateAutoReload({
                    triggerAmount: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-2 h-10"
              />
            </div>
            <div>
              <Label htmlFor="billing-deposit-amount">Deposit amount</Label>
              <Input
                id="billing-deposit-amount"
                type="number"
                min={1}
                step={1}
                value={autoReload.depositAmount}
                onChange={(e) =>
                  updateAutoReload({
                    depositAmount: Number.parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-2 h-10"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{label}</p>
      <p
        className="mt-1 text-lg font-bold"
        style={{ color: highlight ? "#DC2626" : PARENT_NAVY }}
      >
        {value}
      </p>
    </div>
  )
}
