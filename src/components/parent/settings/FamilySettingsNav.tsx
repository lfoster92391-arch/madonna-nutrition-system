"use client"

import { cn } from "@/lib/utils"
import {
  FAMILY_SETTINGS_SECTIONS,
  type FamilySettingsSectionId,
} from "@/components/parent/settings/sections"

type FamilySettingsNavProps = {
  activeSection: FamilySettingsSectionId
  onSectionChange: (section: FamilySettingsSectionId) => void
}

export function FamilySettingsNav({ activeSection, onSectionChange }: FamilySettingsNavProps) {
  return (
    <nav aria-label="Family settings sections" className="space-y-1">
      {FAMILY_SETTINGS_SECTIONS.map(({ id, label }) => {
        const active = activeSection === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex w-full items-center rounded-[14px] border px-4 py-3 text-left text-sm font-medium transition",
              active
                ? "border-primary/20 bg-primary/5 text-primary"
                : "border-transparent text-silver-foreground hover:border-silver/60 hover:bg-silver/5 hover:text-primary"
            )}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}
