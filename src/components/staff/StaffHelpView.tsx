"use client"

import Link from "next/link"
import { BookOpen, HelpCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { formatSupportNames } from "@/config/support-contacts"

export function StaffHelpView() {
  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Help
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Get assistance with the staff portal and cafeteria services
        </p>
      </div>

      <Card
        className="max-w-2xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <BookOpen className="h-5 w-5" />
          Teacher &amp; Staff how-to guide
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Step-by-step: sign in, Parent | Staff switch, order your staff lunch, sign students up,
          and find the lunch calendar.
        </p>
        <Link
          href="/staff/guide"
          className="mt-4 inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
        >
          Open workplace guide
        </Link>
      </Card>

      <Card
        className="max-w-2xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: STAFF_NAVY }}>
          <HelpCircle className="h-5 w-5" />
          Need help?
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Contact {formatSupportNames()} for badge issues, account questions, or lunch schedule
          updates. Staff can view their own cafeteria account balance and published menu
          information.
        </p>
        <div className="mt-6">
          <SupportContactList linkStyle={{ color: STAFF_NAVY }} />
        </div>
      </Card>
    </div>
  )
}
