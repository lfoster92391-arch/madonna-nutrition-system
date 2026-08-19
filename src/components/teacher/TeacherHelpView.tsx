"use client"

import { HelpCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_BG, TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { formatSupportNames } from "@/config/support-contacts"

export function TeacherHelpView() {
  return (
    <div className="space-y-6 p-6" style={{ backgroundColor: TEACHER_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Help
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Get assistance with lunch sign-ups and the teacher portal
        </p>
      </div>
      <Card
        className="max-w-2xl rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <HelpCircle className="h-5 w-5" />
          Need help?
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Contact {formatSupportNames()} for badge issues, student signup help, or lunch schedule
          questions. Teachers cannot view student balances, allergy records, or account controls.
        </p>
        <div className="mt-6">
          <SupportContactList linkStyle={{ color: TEACHER_NAVY }} />
        </div>
      </Card>
    </div>
  )
}
