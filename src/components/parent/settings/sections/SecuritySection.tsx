"use client"

import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { Button } from "@/components/ui/button"

const LOGIN_HISTORY = [
  { date: "Jun 14, 2026", device: "Chrome on Windows", location: "Weirton, WV" },
  { date: "Jun 12, 2026", device: "Safari on iPhone", location: "Weirton, WV" },
  { date: "Jun 8, 2026", device: "Chrome on Windows", location: "Weirton, WV" },
]

export function SecuritySection() {
  return (
    <SettingsPanel
      title="Security"
      description="Protect your family account and review recent sign-in activity."
    >
      <div className="space-y-4">
        <div className="rounded-[14px] border border-silver/60 px-4 py-4">
          <p className="text-sm font-semibold text-primary">Change password</p>
          <p className="mt-1 text-sm text-silver-foreground">
            Update your portal password. You will be signed out of other devices.
          </p>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            Change password
          </Button>
        </div>

        <div className="rounded-[14px] border border-silver/60 px-4 py-4">
          <p className="text-sm font-semibold text-primary">Session management</p>
          <p className="mt-1 text-sm text-silver-foreground">
            View active sessions and sign out of devices you no longer use.
          </p>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            Manage sessions
          </Button>
        </div>

        <div className="rounded-[14px] border border-silver/60 px-4 py-4">
          <p className="text-sm font-semibold text-primary">Login history</p>
          <ul className="mt-3 divide-y divide-silver/30">
            {LOGIN_HISTORY.map((entry) => (
              <li key={entry.date} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:justify-between">
                <span className="font-medium text-primary">{entry.date}</span>
                <span className="text-silver-foreground">
                  {entry.device} ┬╖ {entry.location}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SettingsPanel>
  )
}
