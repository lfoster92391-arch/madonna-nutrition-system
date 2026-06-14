"use client"

import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"

export function TodayAtAGlance() {
  const { stats } = useTeacherData()

  const items = [
    { label: "Students Signed Up", value: stats.studentsSignedUp },
    { label: "Pay at Kiosk", value: stats.payAtKiosk },
    {
      label: "Using Account",
      value: stats.usingAccount,
      note: stats.usingAccountLowFunds > 0 ? `(${stats.usingAccountLowFunds} Low Funds)` : undefined,
    },
    { label: "Prepaid Online", value: stats.prepaidOnline },
  ]

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Today At A Glance
      </h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between border-b pb-3 last:border-0" style={{ borderColor: "#AEB6C2" }}>
            <span className="text-sm text-silver-foreground">{item.label}</span>
            <span className="text-xl font-bold" style={{ color: TEACHER_NAVY }}>
              {item.value}
              {item.note ? (
                <span className="ml-1 text-sm font-medium text-warning">{item.note}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
