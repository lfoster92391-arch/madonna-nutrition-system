"use client"

import { Bell, Mail, User } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import {
  getItHelpDeskMailto,
  IT_HELP_DESK_EMAIL,
  IT_HELP_DESK_LABEL,
} from "@/config/it-help"

export function TeacherSettingsView() {
  const { profile } = useTeacherData()

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
          For lunch portal help, email{" "}
          <a
            href={getItHelpDeskMailto()}
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: TEACHER_NAVY }}
          >
            {IT_HELP_DESK_LABEL}
          </a>{" "}
          (
          <a
            href={getItHelpDeskMailto()}
            className="underline-offset-2 hover:underline"
            style={{ color: TEACHER_NAVY }}
          >
            {IT_HELP_DESK_EMAIL}
          </a>
          ).
        </p>
      </Card>
    </div>
  )
}
