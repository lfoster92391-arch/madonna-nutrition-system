"use client"

import { useEffect, useState } from "react"
import { PreferenceToggle } from "@/components/parent/PreferenceToggle"
import { ParentDrawerShell } from "@/components/parent/v3/ParentDrawerShell"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { NotificationsSection } from "@/components/parent/settings/sections/NotificationsSection"
import {
  getChannelPrefs,
  setChannelPrefs,
  type ChannelPrefs,
} from "@/lib/parent-balance-alerts"
import { V3_NAVY } from "@/components/parent/v3/parent-v3-theme"

type SettingsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDrawer({ open, onOpenChange }: SettingsDrawerProps) {
  const [channels, setChannels] = useState<ChannelPrefs>(getChannelPrefs)
  const [compactView, setCompactView] = useState(false)
  const [language, setLanguage] = useState("English")

  useEffect(() => {
    if (open) {
      setChannels(getChannelPrefs())
    }
  }, [open])

  function updateChannels(patch: Partial<ChannelPrefs>) {
    const next = { ...channels, ...patch }
    setChannels(next)
    setChannelPrefs(next)
  }

  return (
    <ParentDrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Family Settings"
      description="Notifications, alerts, and display preferences."
      wide
    >
      <div className="space-y-6">
        <NotificationsSection />

        <SettingsPanel title="Email Preferences" description="How we reach you for family updates.">
          <div className="space-y-3">
            <PreferenceToggle
              label="Email notifications"
              description="Balance alerts, deposits, and weekly summaries."
              checked={channels.email}
              onChange={(email) => updateChannels({ email })}
            />
            <PreferenceToggle
              label="SMS alerts"
              description="Text message alerts (coming soon)."
              checked={channels.sms}
              onChange={(sms) => updateChannels({ sms })}
              disabled
            />
          </div>
        </SettingsPanel>

        <SettingsPanel title="Display Options">
          <PreferenceToggle
            label="Compact student cards"
            description="Show tighter spacing on smaller screens."
            checked={compactView}
            onChange={setCompactView}
          />
        </SettingsPanel>

        <SettingsPanel title="Language">
          <label htmlFor="parent-language" className="text-sm font-semibold" style={{ color: V3_NAVY }}>
            Preferred language
          </label>
          <select
            id="parent-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-2 h-11 w-full rounded-[12px] border border-[#C7CCD6] bg-white px-4 text-sm font-medium"
            style={{ color: V3_NAVY }}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
          </select>
        </SettingsPanel>
      </div>
    </ParentDrawerShell>
  )
}
