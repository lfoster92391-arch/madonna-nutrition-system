"use client"

import { useStaffData } from "@/components/providers/StaffDataProvider"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { formatCurrency } from "@/lib/utils"

export function StaffAccountView() {
  const { profile } = useStaffData()

  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          My Account
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          View your cafeteria account balance and staff meal information
        </p>
      </div>
      <Card
        className="max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
          Account Funds
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Staff can view their own cafeteria account balance. Student accounts are not accessible
          from the Staff Portal.
        </p>
        <p className="mt-6 text-4xl font-bold" style={{ color: STAFF_NAVY }}>
          {formatCurrency(profile?.accountBalance ?? 0)}
        </p>
        <p className="mt-2 text-sm text-silver-foreground">
          {profile?.displayName ?? "—"} · {profile?.department ?? "Staff"}
        </p>
        <button
          type="button"
          className="mt-6 text-sm font-semibold hover:underline"
          style={{ color: STAFF_NAVY }}
        >
          Add Funds (coming soon)
        </button>
      </Card>
    </div>
  )
}
