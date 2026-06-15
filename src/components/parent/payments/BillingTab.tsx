"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CreditCard, Settings2, Trash2, Wallet } from "lucide-react"
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
import {
  getBillingPreferences,
  getSavedPaymentMethods,
  removeSavedPaymentMethod,
  setBillingPreferences,
  setDefaultPaymentMethod,
  type BillingPreferences,
  type SavedPaymentMethod,
} from "@/lib/parent-billing-prefs"
import { formatCurrency } from "@/lib/utils"

type BillingTabProps = {
  onMakeDeposit: () => void
}

export function BillingTab({ onMakeDeposit }: BillingTabProps) {
  const { linkedStudents, isLoading } = useParentTransactions()
  const preferencesRef = useRef<HTMLDivElement>(null)

  const [prefs, setPrefs] = useState<BillingPreferences>(getBillingPreferences)
  const [autoReload, setAutoReload] = useState<AutoReloadPrefs>(getAutoReloadPrefs)
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([])
  const [showPreferences, setShowPreferences] = useState(false)

  const refreshSavedMethods = useCallback(() => {
    setSavedMethods(getSavedPaymentMethods())
  }, [])

  useEffect(() => {
    setPrefs(getBillingPreferences())
    setAutoReload(getAutoReloadPrefs())
    refreshSavedMethods()
  }, [refreshSavedMethods])

  const familyBalance = linkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const lowBalanceStudents = linkedStudents.filter((s) => s.balance < 5)
  const suggestedDeposit = getSuggestedDeposit(linkedStudents)

  const defaultStudentOptions = useMemo(
    () =>
      linkedStudents.map((s) => ({
        id: s.id,
        label: `${s.firstName} ${s.lastName}`,
      })),
    [linkedStudents]
  )

  function updatePrefs(patch: Partial<BillingPreferences>) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setBillingPreferences(next)
  }

  function updateAutoReload(patch: Partial<AutoReloadPrefs>) {
    const next = { ...autoReload, ...patch }
    setAutoReload(next)
    setAutoReloadPrefs(next)
  }

  function handleManagePreferences() {
    setShowPreferences(true)
    preferencesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (isLoading) {
    return <p className="text-sm text-[#64748B]">Loading billing settings...</p>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold md:text-2xl" style={{ color: PARENT_NAVY }}>
          Billing & Payments
        </h2>
        <p className="mt-1 text-sm text-[#64748B] md:text-base">
          Manage payment preferences for your family.
        </p>
      </div>

      <div className={`${PARENT_CARD} p-4 md:p-5`}>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryItem label="Current Family Balance" value={formatCurrency(familyBalance)} />
          <SummaryItem
            label="Students Needing Funds"
            value={lowBalanceStudents.length > 0 ? String(lowBalanceStudents.length) : "None"}
            highlight={lowBalanceStudents.length > 0}
          />
          <SummaryItem
            label="Deposit Preferences"
            value={
              autoReload.enabled
                ? `Auto reload below ${formatCurrency(autoReload.triggerAmount)}`
                : "One-time deposits"
            }
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            className="rounded-[10px]"
            style={{ backgroundColor: PARENT_NAVY }}
            onClick={onMakeDeposit}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Make Deposit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-[10px] border-[#C8CDD7]"
            style={{ color: PARENT_NAVY }}
            onClick={handleManagePreferences}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Preferences
          </Button>
        </div>
        {suggestedDeposit > 0 && (
          <p className="mt-3 text-sm text-[#64748B]">
            Suggested deposit: {formatCurrency(suggestedDeposit)} to cover low balances.
          </p>
        )}
      </div>

      {savedMethods.length > 0 ? (
        <div className={`${PARENT_CARD} p-4 md:p-5`}>
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Saved Payment Methods
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Optional - only shown because you chose to save a method at checkout.
          </p>
          <ul className="mt-4 space-y-2">
            {savedMethods.map((method) => (
              <li
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#C8CDD7] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" style={{ color: PARENT_NAVY }} />
                  <span className="text-sm font-medium" style={{ color: PARENT_NAVY }}>
                    {method.brand} **** {method.last4}
                  </span>
                  {method.isDefault && (
                    <span className="text-xs font-semibold text-[#64748B]">Default</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-[8px] border-[#C8CDD7] text-xs"
                      style={{ color: PARENT_NAVY }}
                      onClick={() => {
                        setDefaultPaymentMethod(method.id)
                        refreshSavedMethods()
                      }}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[8px] border-[#C8CDD7] text-xs text-danger hover:text-danger"
                    onClick={() => {
                      removeSavedPaymentMethod(method.id)
                      refreshSavedMethods()
                    }}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={`${PARENT_CARD} p-6 text-center md:p-8`}>
          <CreditCard className="mx-auto h-8 w-8 text-[#64748B]" aria-hidden />
          <p className="mt-3 text-sm font-medium" style={{ color: PARENT_NAVY }}>
            No saved payment methods
          </p>
          <p className="mt-1 text-sm text-[#64748B]">
            You can securely add funds without saving payment information.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-[10px]"
            style={{ backgroundColor: PARENT_NAVY }}
            onClick={onMakeDeposit}
          >
            Make Deposit
          </Button>
        </div>
      )}

      <div className={`${PARENT_CARD} space-y-4 p-4 md:p-5`}>
        <div>
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Auto Reload
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Optionally add funds when balances drop below your threshold.
          </p>
        </div>
        <CheckboxField
          id="billing-auto-reload"
          label="Enable Auto Reload"
          description={`When below ${formatCurrency(autoReload.triggerAmount)}, deposit ${formatCurrency(autoReload.depositAmount)}.`}
          checked={autoReload.enabled}
          onCheckedChange={(enabled) => updateAutoReload({ enabled })}
        />
        {autoReload.enabled && (
          <div className="grid gap-4 rounded-[10px] border border-[#C8CDD7] bg-[#041B52]/5 p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="billing-trigger-amount">When balance below</Label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-[#64748B]">$</span>
                <Input
                  id="billing-trigger-amount"
                  type="number"
                  min={0}
                  step={1}
                  value={autoReload.triggerAmount}
                  onChange={(e) =>
                    updateAutoReload({
                      triggerAmount: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="billing-deposit-amount">Automatically deposit</Label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-[#64748B]">$</span>
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
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        ref={preferencesRef}
        className={`${PARENT_CARD} space-y-4 p-4 md:p-5 ${showPreferences ? "ring-2 ring-[#041B52]/20" : ""}`}
      >
        <div>
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Payment Preferences
          </h3>
          <p className="mt-1 text-sm text-[#64748B]">
            Receipts, statements, and funding reminders - no card data stored here.
          </p>
        </div>

        <CheckboxField
          id="billing-email-receipts"
          label="Email receipts"
          description="Receive a receipt after each deposit."
          checked={prefs.emailReceipts}
          onCheckedChange={(emailReceipts) => updatePrefs({ emailReceipts })}
        />
        <CheckboxField
          id="billing-monthly-statements"
          label="Monthly statements"
          description="Summary of cafeteria activity each month."
          checked={prefs.monthlyStatements}
          onCheckedChange={(monthlyStatements) => updatePrefs({ monthlyStatements })}
        />
        <CheckboxField
          id="billing-funding-reminders"
          label="Funding reminders"
          description="Notify when student balances are low."
          checked={prefs.fundingReminders}
          onCheckedChange={(fundingReminders) => updatePrefs({ fundingReminders })}
        />

        {defaultStudentOptions.length > 0 && (
          <div>
            <Label htmlFor="billing-default-student">Default student for deposits</Label>
            <select
              id="billing-default-student"
              className="mt-1 flex h-10 w-full rounded-[10px] border border-[#C8CDD7] bg-white px-3 text-sm"
              style={{ color: PARENT_NAVY }}
              value={prefs.defaultStudentId || defaultStudentOptions[0]?.id || ""}
              onChange={(e) => updatePrefs({ defaultStudentId: e.target.value })}
            >
              {defaultStudentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
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
      <p className="text-sm font-semibold text-[#64748B]">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${highlight ? "text-danger" : ""}`}
        style={!highlight ? { color: PARENT_NAVY } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
