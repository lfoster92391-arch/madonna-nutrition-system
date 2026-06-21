"use client"

import { useEffect, useState } from "react"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { PreferenceToggle } from "@/components/parent/PreferenceToggle"
import { SettingsAccordion, SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { StudentBalanceAlertSection } from "@/components/parent/student-profile/StudentBalanceAlertSection"
import {
  getChannelPrefs,
  getNotificationPrefs,
  setChannelPrefs,
  setNotificationPrefs,
  type ChannelPrefs,
  type ParentNotificationPrefs,
} from "@/lib/parent-balance-alerts"
import {
  fetchServerNotificationPrefs,
  localPrefsToServerPatch,
  patchServerNotificationPrefs,
  serverPrefsToLocal,
} from "@/lib/parent-notification-sync"

const CATEGORIES: {
  key: keyof ParentNotificationPrefs
  label: string
  description: string
}[] = [
  {
    key: "mealNotifications",
    label: "Meal Purchased",
    description: "Daily menu updates and meal purchase confirmations.",
  },
  {
    key: "lowBalanceAlerts",
    label: "Low Balance",
    description: "Notify when a student balance falls below their threshold.",
  },
  {
    key: "depositConfirmations",
    label: "Deposit Confirmed",
    description: "Email when funds are added to a student account.",
  },
  {
    key: "weeklySummary",
    label: "Weekly Summary",
    description: "A weekly digest of balances and recent activity.",
  },
  {
    key: "schoolAnnouncements",
    label: "School Announcements",
    description: "Nutrition office updates, closures, and menu changes.",
  },
]

export function NotificationsSection() {
  const { students: linkedStudents } = useParentLinkedStudents()
  const [prefs, setPrefs] = useState<ParentNotificationPrefs>(getNotificationPrefs)
  const [channels, setChannels] = useState<ChannelPrefs>(getChannelPrefs)

  useEffect(() => {
    setPrefs(getNotificationPrefs())
    setChannels(getChannelPrefs())
    void fetchServerNotificationPrefs().then((server) => {
      if (!server) return
      const mapped = serverPrefsToLocal(server)
      setPrefs(mapped.notification)
      setChannels(mapped.channels)
      setNotificationPrefs(mapped.notification)
      setChannelPrefs(mapped.channels)
    })
  }, [])

  function updatePrefs(patch: Partial<ParentNotificationPrefs>) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    setNotificationPrefs(next)
    void patchServerNotificationPrefs(localPrefsToServerPatch({ notification: next }))
  }

  function updateChannels(patch: Partial<ChannelPrefs>) {
    const next = { ...channels, ...patch }
    setChannels(next)
    setChannelPrefs(next)
    void patchServerNotificationPrefs(localPrefsToServerPatch({ channels: next }))
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Notification Categories"
        description="Choose which updates you receive. Delivery channels apply across categories."
      >
        <div className="space-y-3">
          {CATEGORIES.map(({ key, label, description }) => (
            <PreferenceToggle
              key={key}
              label={label}
              description={description}
              checked={prefs[key]}
              onChange={(checked) => updatePrefs({ [key]: checked })}
            />
          ))}
        </div>

        <div className="rounded-[14px] border border-silver/60 bg-silver/5 p-4">
          <p className="text-sm font-semibold text-primary">Delivery channels</p>
          <p className="mt-1 text-xs text-silver-foreground">
            Push, email, and SMS preferences for all notification categories.
          </p>
          <div className="mt-4 space-y-3">
            <PreferenceToggle
              label="Email"
              description="Balance alerts, deposits, and weekly summaries."
              checked={channels.email}
              onChange={(email) => updateChannels({ email })}
            />
            <PreferenceToggle
              label="SMS"
              description="Text message alerts (coming soon)."
              checked={channels.sms}
              onChange={(sms) => updateChannels({ sms })}
              disabled
            />
            <PreferenceToggle
              label="Push"
              description="In-app and mobile push notifications (coming soon)."
              checked={channels.push}
              onChange={(push) => updateChannels({ push })}
              disabled
            />
          </div>
        </div>

        <SettingsAccordion
          title="Per-student notification options"
          description="Customize alerts for individual students (coming soon)."
        >
          <ul className="space-y-2 text-sm text-silver-foreground">
            {linkedStudents.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between rounded-[14px] border border-silver/40 px-3 py-2"
              >
                <span className="font-medium text-primary">
                  {student.firstName} {student.lastName}
                </span>
                <span className="text-xs">Uses family defaults</span>
              </li>
            ))}
          </ul>
        </SettingsAccordion>
      </SettingsPanel>

      <SettingsPanel
        title="Low Balance Alerts"
        description="Set per-student thresholds and pause alerts when needed."
      >
        <div className="space-y-8">
          {linkedStudents.map((student) => (
            <div key={student.id}>
              <p className="mb-4 text-sm font-semibold text-primary">
                {student.firstName} {student.lastName}
              </p>
              <StudentBalanceAlertSection studentId={student.id} balance={student.balance} />
            </div>
          ))}
        </div>
      </SettingsPanel>
    </div>
  )
}
