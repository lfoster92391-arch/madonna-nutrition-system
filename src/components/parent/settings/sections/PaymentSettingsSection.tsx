"use client"

import Link from "next/link"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"
import { CARD_SAFETY_COPY } from "@/lib/security/card-copy"

export function PaymentSettingsSection() {
  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Card payments"
        description="Secure cafeteria deposits through Stripe — cards are not stored here."
      >
        <p className="rounded-[14px] border border-dashed border-silver/60 px-4 py-6 text-sm leading-relaxed text-silver-foreground">
          {CARD_SAFETY_COPY} Auto-reload with a saved card is intentionally not offered.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/parent/payments?tab=funding">Add funds</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/parent/payments?tab=methods">Billing history</Link>
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Low balance alerts"
        description="Get notified when a student balance is low — then add funds manually when you are ready."
      >
        <p className="text-sm text-silver-foreground">
          Manage per-student alert thresholds from each student profile. Deposits always use Stripe
          Checkout with a fresh card entry.
        </p>
        <Button asChild variant="outline">
          <Link href="/parent/student-profile">Student profiles</Link>
        </Button>
      </SettingsPanel>
    </div>
  )
}
