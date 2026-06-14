"use client"

import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"

export function PrivacySection() {
  return (
    <SettingsPanel
      title="Privacy"
      description="Control how your family's data is used and shared with the school nutrition program."
    >
      <div className="space-y-4">
        <StubCard
          title="Data export"
          description="Download a copy of your family's cafeteria account data."
          actionLabel="Request export"
        />
        <StubCard
          title="Parent permissions"
          description="Manage which guardians can view balances, make deposits, and update food profiles."
          actionLabel="Manage permissions"
        />
        <StubCard
          title="Marketing & communications"
          description="Opt in or out of optional nutrition program newsletters."
          actionLabel="Update preferences"
        />
      </div>
    </SettingsPanel>
  )
}

function StubCard({
  title,
  description,
  actionLabel,
}: {
  title: string
  description: string
  actionLabel: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-silver/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-sm text-silver-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" disabled className="shrink-0">
        {actionLabel}
      </Button>
    </div>
  )
}
