"use client"

import Link from "next/link"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"

export function SupportSection() {
  return (
    <SettingsPanel
      title="Support"
      description="Get help from the Madonna nutrition office or report an issue with your account."
    >
      <div className="space-y-4">
        <SupportCard
          title="Contact nutrition office"
          description="nutrition@madonnahs.org ┬╖ (304) 748-4414 ┬╖ MonΓÇôFri, 7:30 AM ΓÇô 2:30 PM"
          actionLabel="Email office"
          href="mailto:nutrition@madonnahs.org"
        />
        <SupportCard
          title="FAQ"
          description="Answers about balances, allergies, deposits, and lunch reservations."
          actionLabel="Browse FAQ"
          href="/parent/help"
        />
        <SupportCard
          title="Report an issue"
          description="Tell us about a incorrect charge, missing deposit, or portal problem."
          actionLabel="Report issue"
          disabled
        />
        <SupportCard
          title="Request a callback"
          description="A nutrition staff member will call you back within one business day."
          actionLabel="Request callback"
          disabled
        />
      </div>
    </SettingsPanel>
  )
}

function SupportCard({
  title,
  description,
  actionLabel,
  href,
  disabled,
}: {
  title: string
  description: string
  actionLabel: string
  href?: string
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-silver/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-sm text-silver-foreground">{description}</p>
      </div>
      {href && !disabled ? (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      ) : (
        <Button variant="outline" size="sm" className="shrink-0" disabled={disabled}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
