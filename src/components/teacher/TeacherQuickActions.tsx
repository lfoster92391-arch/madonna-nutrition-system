"use client"

import Link from "next/link"
import { Calendar, CreditCard, Download, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"

const actions = [
  { label: "Add Funds", href: "/teacher/account", icon: Wallet },
  { label: "View Calendar", href: "/teacher/calendar", icon: Calendar },
  { label: "View Transactions", href: "/teacher/transactions", icon: CreditCard },
  { label: "Export Calendar", href: "/teacher/calendar", icon: Download },
]

export function TeacherQuickActions() {
  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Quick Actions
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {actions.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition hover:bg-[#041B52]/5"
            style={{ borderColor: "#AEB6C2" }}
          >
            <Icon className="h-6 w-6" style={{ color: TEACHER_NAVY }} />
            <span className="text-center text-xs font-semibold" style={{ color: TEACHER_NAVY }}>
              {label}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  )
}
