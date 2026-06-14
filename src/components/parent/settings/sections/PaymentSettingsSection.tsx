"use client"

import Link from "next/link"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"

export function PaymentSettingsSection() {
  return (
    <SettingsPanel
      title="Payments"
      description="Manage saved payment methods, auto-reload preferences, and deposit history."
    >
      <div className="space-y-4">
        <div className="rounded-[14px] border border-silver/60 p-4">
          <p className="font-semibold text-primary">Payment methods</p>
          <p className="mt-1 text-sm text-silver-foreground">
            Add or update cards used for cafeteria deposits.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/parent/payment-methods">Manage Payment Methods</Link>
          </Button>
        </div>
        <div className="rounded-[14px] border border-silver/60 p-4">
          <p className="font-semibold text-primary">Add funds</p>
          <p className="mt-1 text-sm text-silver-foreground">
            Deposit money into student lunch accounts.
          </p>
          <Button asChild className="mt-3">
            <Link href="/parent/add-funds">Go to Add Funds</Link>
          </Button>
        </div>
        <div className="rounded-[14px] border border-silver/60 p-4">
          <p className="font-semibold text-primary">Transaction history</p>
          <p className="mt-1 text-sm text-silver-foreground">
            Review recent deposits and cafeteria purchases.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <Link href="/parent/transactions">View Transactions</Link>
          </Button>
        </div>
      </div>
    </SettingsPanel>
  )
}
