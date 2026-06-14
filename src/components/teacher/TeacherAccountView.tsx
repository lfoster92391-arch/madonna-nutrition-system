"use client"

import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { TeacherDashboardHeader } from "@/components/teacher/TeacherDashboardHeader"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"
import { formatCurrency } from "@/lib/utils"

export function TeacherAccountView() {
  const { profile } = useTeacherData()

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <TeacherDashboardHeader subtitle="My Account" />
      <div className="p-8">
        <Card className="max-w-xl rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
          <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            Account Funds
          </h2>
          <p className="mt-2 text-sm text-silver-foreground">
            Teachers can view their own cafeteria account balance. Student balances are never shown.
          </p>
          <p className="mt-6 text-4xl font-bold" style={{ color: TEACHER_NAVY }}>
            {formatCurrency(profile?.accountBalance ?? 0)}
          </p>
          <p className="mt-2 text-sm text-silver-foreground">
            {profile?.displayName} · {profile?.department}
          </p>
          <button
            type="button"
            className="mt-6 text-sm font-semibold hover:underline"
            style={{ color: TEACHER_NAVY }}
          >
            Add Funds (coming soon)
          </button>
        </Card>
      </div>
    </div>
  )
}
