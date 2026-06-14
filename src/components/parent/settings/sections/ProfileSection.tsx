"use client"

import { useEffect, useState } from "react"
import { parentDemoUser } from "@/data/demo"
import { useAuth } from "@/components/providers/AuthProvider"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"

type ProfileForm = {
  name: string
  email: string
  phone: string
  preferredContact: "email" | "phone" | "sms"
  language: string
  householdNotes: string
}

const DEFAULT_PROFILE: ProfileForm = {
  name: parentDemoUser.name,
  email: parentDemoUser.email,
  phone: "555-0201",
  preferredContact: "email",
  language: "English",
  householdNotes: "Nut-free household prep; notify for field trips.",
}

export function ProfileSection() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState<ProfileForm>(DEFAULT_PROFILE)
  const [draft, setDraft] = useState<ProfileForm>(DEFAULT_PROFILE)

  useEffect(() => {
    if (user?.displayName) {
      setSaved((prev) => ({ ...prev, name: user.displayName, email: user.email }))
      setDraft((prev) => ({ ...prev, name: user.displayName, email: user.email }))
    }
  }, [user])

  function handleSave() {
    setSaved(draft)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(saved)
    setEditing(false)
  }

  return (
    <SettingsPanel
      title="Family Profile"
      description="Your primary contact details and household preferences for Fuel The Dons."
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Parent name">
          {editing ? (
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          ) : (
            <p className="text-sm font-medium text-primary">{saved.name}</p>
          )}
        </Field>
        <Field label="Email">
          {editing ? (
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
          ) : (
            <p className="text-sm font-medium text-primary">{saved.email}</p>
          )}
        </Field>
        <Field label="Phone">
          {editing ? (
            <Input
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            />
          ) : (
            <p className="text-sm font-medium text-primary">{saved.phone}</p>
          )}
        </Field>
        <Field label="Preferred contact">
          {editing ? (
            <select
              value={draft.preferredContact}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  preferredContact: e.target.value as ProfileForm["preferredContact"],
                })
              }
              className="h-10 w-full rounded-[14px] border border-silver/60 bg-white px-3 text-sm"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
            </select>
          ) : (
            <p className="text-sm font-medium capitalize text-primary">{saved.preferredContact}</p>
          )}
        </Field>
        <Field label="Language">
          {editing ? (
            <Input
              value={draft.language}
              onChange={(e) => setDraft({ ...draft, language: e.target.value })}
            />
          ) : (
            <p className="text-sm font-medium text-primary">{saved.language}</p>
          )}
        </Field>
        <Field label="Household preferences" className="sm:col-span-2">
          {editing ? (
            <textarea
              value={draft.householdNotes}
              onChange={(e) => setDraft({ ...draft, householdNotes: e.target.value })}
              rows={3}
              className="w-full rounded-[14px] border border-silver/60 bg-white px-3 py-2 text-sm"
            />
          ) : (
            <p className="text-sm text-primary">{saved.householdNotes}</p>
          )}
        </Field>
      </div>

      <div className="flex flex-wrap gap-3">
        {editing ? (
          <>
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>
    </SettingsPanel>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}
