"use client"

import Link from "next/link"
import { Bell, Mail, User, Users } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { formatSupportNames } from "@/config/support-contacts"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { formatCurrency } from "@/lib/utils"

export function TeacherSettingsView() {
  const { profile } = useTeacherData()
  const { students: children, isLoading: loadingChildren } = useParentLinkedStudents()

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Manage your teacher portal preferences
        </p>
      </div>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <User className="h-5 w-5" />
          Profile
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt style={{ color: TEACHER_SILVER }}>Name</dt>
            <dd className="font-medium" style={{ color: TEACHER_NAVY }}>
              {profile?.displayName ?? "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: TEACHER_SILVER }}>Email</dt>
            <dd className="font-medium" style={{ color: TEACHER_NAVY }}>
              {profile?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: TEACHER_SILVER }}>Department</dt>
            <dd className="font-medium" style={{ color: TEACHER_NAVY }}>
              {profile?.department ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <Users className="h-5 w-5" />
          Your children
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Link a student to this same school login. After you add a child, use Parent | Teacher in
          the top bar to open the parent portal.
        </p>

        {loadingChildren ? (
          <p className="mt-4 text-sm text-silver-foreground">Loading…</p>
        ) : children.length === 0 ? (
          <p className="mt-4 text-sm text-silver-foreground">No children linked yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {children.map((child) => (
              <li
                key={child.id}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: TEACHER_SILVER }}
              >
                <span style={{ color: TEACHER_NAVY }}>
                  <span className="font-semibold">
                    {child.firstName} {child.lastName}
                  </span>
                  <span className="block text-xs text-silver-foreground">
                    MD {child.id} · Grade {child.grade}
                  </span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: TEACHER_NAVY }}>
                  {formatCurrency(child.balance)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Button asChild className="mt-5 w-full sm:w-auto">
          <Link href="/teacher/settings/add-child">Add your child</Link>
        </Button>
      </Card>

      <Card
        className="max-w-xl rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <div className="mt-4 space-y-3">
          {[
            "Lunch menu changes",
            "Sign-up cutoff reminders",
            "Nutrition office announcements",
          ].map((label) => (
            <label
              key={label}
              className="flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3"
              style={{ borderColor: TEACHER_SILVER }}
            >
              <span className="text-sm" style={{ color: TEACHER_NAVY }}>
                {label}
              </span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#0A1E3F]" />
            </label>
          ))}
        </div>
      </Card>

      <Card
        className="max-w-xl rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <Mail className="h-5 w-5" />
          Support
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          For lunch portal help, email {formatSupportNames()}.
        </p>
        <div className="mt-4">
          <SupportContactList linkStyle={{ color: TEACHER_NAVY }} />
        </div>
      </Card>
    </div>
  )
}
