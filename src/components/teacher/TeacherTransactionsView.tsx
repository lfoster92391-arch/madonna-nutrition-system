"use client"

import { TeacherDashboardHeader } from "@/components/teacher/TeacherDashboardHeader"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"

export function TeacherTransactionsView() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <TeacherDashboardHeader subtitle="Transactions" />
      <div className="p-8">
        <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
          <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            Your Meal Transactions
          </h2>
          <p className="mt-2 text-sm text-silver-foreground">
            Teacher personal transaction history will appear here. Student payment history is not
            accessible from the Teacher Portal.
          </p>
          <div
            className="mt-6 rounded-2xl border border-dashed px-6 py-10 text-center"
            style={{ borderColor: "#AEB6C2" }}
          >
            <p className="text-sm font-medium text-silver-foreground">No transactions to display (stub)</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
