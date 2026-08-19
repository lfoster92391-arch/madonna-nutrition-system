"use client"

import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"
import { SUPPORT_CONTACTS, getSupportMailto } from "@/config/support-contacts"

export function SupportSection() {
  return (
    <SettingsPanel
      title="Support Center"
      description="Email Mrs. Morris or Mrs. Dalfol for help with your cafeteria account."
    >
      <div className="space-y-4">
        {SUPPORT_CONTACTS.map((contact) => (
          <div
            key={contact.email}
            className="flex flex-col gap-3 rounded-[14px] border border-silver/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-primary">{contact.name}</p>
              <p className="mt-1 text-sm text-silver-foreground">{contact.email}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={getSupportMailto(contact.email)}>Email {contact.name}</a>
            </Button>
          </div>
        ))}
      </div>
    </SettingsPanel>
  )
}
