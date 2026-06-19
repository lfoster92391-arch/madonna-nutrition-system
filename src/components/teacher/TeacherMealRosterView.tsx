"use client"

import Image from "next/image"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

const STATUS_LABELS = {
  using_account: "Using Account",
  prepaid: "Prepaid",
  pay_at_kiosk: "Pay At Kiosk",
  low_funds: "Low Funds",
} as const

function formatSignedUpTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function TeacherMealRosterView() {
  const { signups, reservation, stats } = useTeacherData()
  const todayMeal = reservation?.mealName ?? "Today's Lunch"

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Meal Roster
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Today&apos;s lunch sign-ups for your classes — {todayMeal}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Signed Up", value: stats.studentsSignedUp },
          { label: "Using Account", value: stats.usingAccount },
          { label: "Prepaid", value: stats.prepaidOnline },
          { label: "Pay at Kiosk", value: stats.payAtKiosk },
        ].map((item) => (
          <Card
            key={item.label}
            className="rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: TEACHER_SILVER }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: TEACHER_SILVER }}>
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card
        className="rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs uppercase tracking-wide"
                style={{ borderColor: TEACHER_SILVER, color: TEACHER_SILVER }}
              >
                <th className="pb-3 pr-4 font-semibold">Student</th>
                <th className="pb-3 pr-4 font-semibold">Grade</th>
                <th className="pb-3 pr-4 font-semibold">Time</th>
                <th className="pb-3 pr-4 font-semibold">Selected Meal</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((signup) => (
                <tr key={signup.id} className="border-b" style={{ borderColor: TEACHER_SILVER }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Image
                        src={signup.photo}
                        alt={signup.studentName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="font-medium" style={{ color: TEACHER_NAVY }}>
                        {signup.studentName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-silver-foreground">{signup.grade}</td>
                  <td className="py-3 pr-4 text-silver-foreground">
                    {formatSignedUpTime(signup.signedUpAt)}
                  </td>
                  <td className="py-3 pr-4" style={{ color: TEACHER_NAVY }}>
                    {todayMeal}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={signup.status === "low_funds" ? "warning" : "outline"}
                      className={
                        signup.status === "low_funds"
                          ? "bg-warning/15 text-warning"
                          : signup.status === "prepaid"
                            ? "text-success"
                            : ""
                      }
                    >
                      {STATUS_LABELS[signup.status]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
