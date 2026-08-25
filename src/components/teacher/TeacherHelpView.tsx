"use client"

import Link from "next/link"
import { BookOpen, HelpCircle } from "lucide-react"
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
          <BookOpen className="h-5 w-5" />
          Teacher &amp; Staff how-to guide
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Step-by-step: sign in, Parent | Teacher switch, order your staff lunch, sign students up,
          and find the lunch calendar.
        </p>
        <Link
          href="/teacher/guide"
          className="mt-4 inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
        >
          Open workplace guide
        </Link>
      </Card>

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
