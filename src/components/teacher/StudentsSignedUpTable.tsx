"use client"

import Image from "next/image"
import { Download } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"

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

export function StudentsSignedUpTable() {
  const { signups } = useTeacherData()

  function exportList() {
    const header = "Student,Grade,Payment Method,Status,Signed Up"
    const rows = signups.map(
      (s) =>
        `"${s.studentName}",${s.grade},${s.paymentMethod},${STATUS_LABELS[s.status]},${formatSignedUpTime(s.signedUpAt)}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "students-signed-up-today.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          Students Signed Up For Lunch Today
        </h2>
        <Button variant="outline" size="sm" onClick={exportList}>
          <Download className="mr-2 h-4 w-4" />
          Export List
        </Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide" style={{ borderColor: "#AEB6C2", color: "#AEB6C2" }}>
              <th className="pb-3 pr-4 font-semibold">Student</th>
              <th className="pb-3 pr-4 font-semibold">Grade</th>
              <th className="pb-3 pr-4 font-semibold">Payment</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {signups.map((signup) => (
              <tr key={signup.id} className="border-b" style={{ borderColor: "#AEB6C2" }}>
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
                <td className="py-3 pr-4 capitalize text-silver-foreground">
                  {signup.paymentMethod.replace("_", " ")}
                </td>
                <td className="py-3 pr-4">
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
                <td className="py-3 text-silver-foreground">{formatSignedUpTime(signup.signedUpAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="mt-4 text-sm font-semibold hover:underline"
        style={{ color: TEACHER_NAVY }}
      >
        View All
      </button>
    </Card>
  )
}
