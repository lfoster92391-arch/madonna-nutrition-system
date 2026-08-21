"use client"

import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { useParentAnnouncements } from "@/hooks/useParentAnnouncements"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { AlertCenter, buildAlertItems } from "@/components/parent/AlertCenter"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { SettingsPanel } from "@/components/parent/settings/SettingsPanel"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { getPendingSubmission, getStudentProfile } from "@/lib/student-profiles"
import { isDietaryFormBlocking } from "@/lib/types"
import { useEffect, useMemo, useState } from "react"

type ProfileForm = {
  name: string
  email: string
  phone: string
  preferredContact: "email" | "phone" | "sms"
  language: string
  householdNotes: string
}

const EMPTY_PROFILE: ProfileForm = {
  name: "",
  email: "",
  phone: "",
  preferredContact: "email",
  language: "English",
  householdNotes: "",
}

export function ProfileSection() {
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()
  const announcements = useParentAnnouncements()
  const { mealTransactions, isLoading: txLoading } = useParentTransactions()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState<ProfileForm>(EMPTY_PROFILE)
  const [draft, setDraft] = useState<ProfileForm>(EMPTY_PROFILE)

  useEffect(() => {
    if (user?.displayName) {
      setSaved((prev) => ({ ...prev, name: user.displayName, email: user.email }))
      setDraft((prev) => ({ ...prev, name: user.displayName, email: user.email }))
    }
  }, [user])

  const familyBalance = useMemo(
    () => linkedStudents.reduce((sum, s) => sum + s.balance, 0),
    [linkedStudents]
  )

  const lowBalanceStudents = linkedStudents.filter((s) => s.balance < 5)
  const debtStudents = linkedStudents.filter((s) => s.balance < 0)
  const dietaryFormIssues = linkedStudents.filter((student) => {
    const profile = getStudentProfile(student.id, studentProfiles)
    const pending = getPendingSubmission(student.id, allergySubmissions)
    return isDietaryFormBlocking(profile, pending)
  })
  const reviewHref =
    dietaryFormIssues.length === 1
      ? `/parent/student-profile/${dietaryFormIssues[0].id}?tab=dietary`
      : "/parent/student-profile"

  const alertItems = buildAlertItems({
    lowBalanceStudents,
    debtStudents,
    dietaryFormIssueCount: dietaryFormIssues.length,
    reviewHref,
    announcements,
  })

  const recentCharges = mealTransactions.slice(0, 5)

  function handleSave() {
    setSaved(draft)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(saved)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <SettingsPanel
        title="Account overview"
        description="Balances and linked children for your Fuel The Dons family account."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <OverviewStat label="Family balance" value={formatCurrency(familyBalance)} />
          <OverviewStat
            label="Linked children"
            value={String(linkedStudents.length)}
          />
          <OverviewStat
            label="Needs attention"
            value={String(alertItems.length)}
          />
        </div>
        {linkedStudents.length > 0 ? (
          <ul className="mt-4 divide-y divide-silver/40 rounded-xl border border-silver/40">
            {linkedStudents.map((student) => (
              <li
                key={student.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-primary">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-silver-foreground">Grade {student.grade}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      student.balance < 0
                        ? "text-red-700"
                        : student.balance < 5
                          ? "text-amber-800"
                          : "text-primary"
                    }`}
                  >
                    {formatCurrency(student.balance)}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/parent/student-profile/${student.id}`}>Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-silver-foreground">
            No children linked yet.{" "}
            <Link href="/parent/add-child" className="font-medium text-primary underline">
              Link a student
            </Link>
          </p>
        )}
      </SettingsPanel>

      <SettingsPanel
        title="Alerts & announcements"
        description="Low balances, debt that needs paid, and school notices for your linked children only."
      >
        <AlertCenter items={alertItems} />
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/parent/alerts">Open full alerts</Link>
          </Button>
        </div>
      </SettingsPanel>

      <SettingsPanel
        title="Spending activity"
        description="Recent cafeteria charges across your linked children."
      >
        {txLoading ? (
          <p className="text-sm text-silver-foreground">Loading recent charges…</p>
        ) : recentCharges.length === 0 ? (
          <p className="text-sm text-silver-foreground">No recent meal charges yet.</p>
        ) : (
          <ul className="divide-y divide-silver/40 rounded-xl border border-silver/40">
            {recentCharges.map((tx) => (
              <li key={tx.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-medium text-primary">{tx.studentName}</p>
                  <p className="text-sm text-silver-foreground">
                    {tx.meal} · {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="font-semibold tabular-nums text-primary">
                  {formatCurrency(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/parent/meal-history">View meal history</Link>
          </Button>
        </div>
      </SettingsPanel>

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
              <p className="text-sm font-medium text-primary">{saved.name || "—"}</p>
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
              <p className="text-sm font-medium text-primary">{saved.email || "—"}</p>
            )}
          </Field>
          <Field label="Phone">
            {editing ? (
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            ) : (
              <p className="text-sm font-medium text-primary">{saved.phone || "—"}</p>
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
              <p className="text-sm text-primary">{saved.householdNotes || "—"}</p>
            )}
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
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
    </div>
  )
}

function OverviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-silver/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
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
