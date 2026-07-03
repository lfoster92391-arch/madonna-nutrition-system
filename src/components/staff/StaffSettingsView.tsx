"use client"

import { Bell, Mail, User } from "lucide-react"
import { useStaffData } from "@/components/providers/StaffDataProvider"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"

export function StaffSettingsView() {
  const { profile } = useStaffData()

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Manage your staff portal preferences
        </p>
      </div>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <User className="h-5 w-5" />
          Profile
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt style={{ color: STAFF_SILVER }}>Name</dt>
            <dd className="font-medium" style={{ color: STAFF_NAVY }}>
              {profile?.displayName ?? "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: STAFF_SILVER }}>Email</dt>
            <dd className="font-medium" style={{ color: STAFF_NAVY }}>
              {profile?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt style={{ color: STAFF_SILVER }}>Department</dt>
            <dd className="font-medium" style={{ color: STAFF_NAVY }}>
              {profile?.department ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <Bell className="h-5 w-5" />
          Notifications
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Email notifications for lunch schedule changes and menu updates are managed by your
          administrator.
        </p>
      </Card>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <Mail className="h-5 w-5" />
          Support
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Contact the nutrition office for account or badge issues.
        </p>
      </Card>
    </div>
  )
}
