"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Mail, User, Users } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { useStaffData } from "@/components/providers/StaffDataProvider"
import { WorkplaceUserPhotoUpload } from "@/components/workplace/WorkplaceUserPhotoUpload"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { formatSupportNames } from "@/config/support-contacts"
import { formatCurrency } from "@/lib/utils"

type LinkedChild = {
  id: string
  firstName: string
  lastName: string
  grade: string
  balance: number
}

export function StaffSettingsView() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const { profile, setProfilePhoto } = useStaffData()
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)

  const loadChildren = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setChildren([])
      setLoadingChildren(false)
      return
    }
    setLoadingChildren(true)
    try {
      const res = await fetch(`/api/staff/linked-students?staffId=${user.id}`)
      if (res.ok) {
        const data = (await res.json()) as { students?: LinkedChild[] }
        setChildren(data.students ?? [])
      } else {
        setChildren([])
      }
    } finally {
      setLoadingChildren(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadChildren()
  }, [loadChildren])

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

        {user ? (
          <div className="mt-6 border-t pt-6" style={{ borderColor: STAFF_SILVER }}>
            <h3 className="text-base font-semibold" style={{ color: STAFF_NAVY }}>
              Badge photo
            </h3>
            <div className="mt-3">
              <WorkplaceUserPhotoUpload
                userId={user.id}
                displayName={profile?.displayName ?? "Staff"}
                currentPhoto={profile?.photoUrl}
                accentColor={STAFF_NAVY}
                onSaved={setProfilePhoto}
              />
            </div>
          </div>
        ) : null}
      </Card>

      <Card
        className="w-full max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <Users className="h-5 w-5" />
          Your children
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Connect a student account so you can see balances and add lunch funds. If you are also a
          parent, use the Parent / Staff switch in the top bar to open the parent portal.
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
                style={{ borderColor: STAFF_SILVER }}
              >
                <span style={{ color: STAFF_NAVY }}>
                  <span className="font-semibold">
                    {child.firstName} {child.lastName}
                  </span>
                  <span className="block text-xs text-silver-foreground">
                    MD {child.id} · Grade {child.grade}
                  </span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: STAFF_NAVY }}>
                  {formatCurrency(child.balance)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Button asChild className="mt-5 w-full sm:w-auto">
          <Link href="/staff/settings/add-child">Add your child</Link>
        </Button>
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
          Contact {formatSupportNames()} for account or badge issues.
        </p>
        <div className="mt-4">
          <SupportContactList linkStyle={{ color: STAFF_NAVY }} />
        </div>
      </Card>
    </div>
  )
}
