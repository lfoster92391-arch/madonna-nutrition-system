"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PreferenceToggle } from "@/components/parent/PreferenceToggle"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import {
  getAutoReloadPrefs,
  setAutoReloadPrefs,
  type AutoReloadPrefs,
} from "@/lib/parent-balance-alerts"
import { formatCurrency } from "@/lib/utils"

const DEMO_PAYMENT_METHODS = [
  { id: "pm-1", label: "Visa ending in 4242", default: true },
  { id: "pm-2", label: "Mastercard ending in 8888", default: false },
]

export function PaymentSettingsSection() {
  const [autoReload, setAutoReload] = useState<AutoReloadPrefs>(getAutoReloadPrefs)

  useEffect(() => {
    setAutoReload(getAutoReloadPrefs())
  }, [])

  function updateAutoReload(patch: Partial<AutoReloadPrefs>) {
    const next = { ...autoReload, ...patch }
    setAutoReload(next)
    setAutoReloadPrefs(next)
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Saved Payment Methods"
        description="Cards used for cafeteria prepay and auto reload."
      >
        <ul className="space-y-3">
          {DEMO_PAYMENT_METHODS.map((method) => (
            <li
              key={method.id}
              className="flex items-center justify-between rounded-[14px] border border-silver/60 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-primary">{method.label}</p>
                {method.default && (
                  <p className="text-xs text-silver-foreground">Default for deposits</p>
                )}
              </div>
              <Button variant="outline" size="sm" disabled>
                Manage
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/parent/payments?tab=funding">Open Payments Center</Link>
          </Button>
          <Button asChild>
            <Link href="/parent/add-funds">Add funds</Link>
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Auto Reload & Funding Rules"
        description="Automatically deposit funds when balances drop below your chosen amount."
      >
        <PreferenceToggle
          label="Enable auto reload"
          description="Uses your default payment method when triggered."
          checked={autoReload.enabled}
          onChange={(enabled) => updateAutoReload({ enabled })}
        />

        <div className="grid gap-4 rounded-[14px] border border-silver/60 bg-silver/5 p-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="trigger-amount">When balance below</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-silver-foreground">$</span>
              <Input
                id="trigger-amount"
                type="number"
                min={0}
                step={1}
                value={autoReload.triggerAmount}
                disabled={!autoReload.enabled}
                onChange={(e) =>
                  updateAutoReload({ triggerAmount: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div>
            <Label htmlFor="deposit-amount">Automatically deposit</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-silver-foreground">$</span>
              <Input
                id="deposit-amount"
                type="number"
                min={1}
                step={1}
                value={autoReload.depositAmount}
                disabled={!autoReload.enabled}
                onChange={(e) =>
                  updateAutoReload({ depositAmount: Number.parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <p className="sm:col-span-2 text-sm text-silver-foreground">
            Threshold rule: Below {formatCurrency(autoReload.triggerAmount)} → Add{" "}
            {formatCurrency(autoReload.depositAmount)} across linked students.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/parent/payments?tab=funding">More funding options</Link>
        </Button>
      </SettingsPanel>
    </div>
  )
}
