"use client"

import { useEffect, useState } from "react"
import { PreferenceToggle } from "@/components/parent/PreferenceToggle"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import {
  getNotificationPrefs,
  setNotificationPrefs,
  type ParentNotificationPrefs,
} from "@/lib/parent-balance-alerts"

export function NotificationsSection() {
  const [prefs, setPrefs] = useState<ParentNotificationPrefs>(getNotificationPrefs)

  useEffect(() => {
    setPrefs(getNotificationPrefs())
  }, [])

  function update(patch: Partial<ParentNotificationPrefs>) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setNotificationPrefs(next)
  }

  return (
    <SettingsPanel
      title="Notifications"
      description="Choose how Fuel The Dons keeps your family informed about meals, balances, and school updates."
    >
      <div className="space-y-3">
        <PreferenceToggle
          label="Meal notifications"
          description="Daily menu updates and meal purchase confirmations."
          checked={prefs.mealNotifications}
          onChange={(mealNotifications) => update({ mealNotifications })}
        />
        <PreferenceToggle
          label="Low balance alerts"
          description="Notify when a student balance falls below their threshold."
          checked={prefs.lowBalanceAlerts}
          onChange={(lowBalanceAlerts) => update({ lowBalanceAlerts })}
        />
        <PreferenceToggle
          label="Deposit confirmations"
          description="Email when funds are added to a student account."
          checked={prefs.depositConfirmations}
          onChange={(depositConfirmations) => update({ depositConfirmations })}
        />
        <PreferenceToggle
          label="Weekly summary"
          description="A weekly digest of balances and recent activity."
          checked={prefs.weeklySummary}
          onChange={(weeklySummary) => update({ weeklySummary })}
        />
        <PreferenceToggle
          label="School announcements"
          description="Important updates from nutrition services."
          checked={prefs.schoolAnnouncements}
          onChange={(schoolAnnouncements) => update({ schoolAnnouncements })}
        />
      </div>
    </SettingsPanel>
  )
}
