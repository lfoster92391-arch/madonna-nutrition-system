"use client"

import { HelpCircle, Mail } from "lucide-react"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import {
  getItHelpDeskMailto,
  IT_HELP_DESK_EMAIL,
  IT_HELP_DESK_LABEL,
} from "@/config/it-help"

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
          <HelpCircle className="h-5 w-5" />
          Need help?
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Contact {IT_HELP_DESK_LABEL} for badge issues, account questions, or lunch schedule
          updates. Staff can view their own cafeteria account balance and published menu
          information.
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <a
            href={getItHelpDeskMailto()}
            className="flex items-center gap-2 font-medium underline-offset-2 hover:underline"
            style={{ color: STAFF_NAVY }}
          >
            <Mail className="h-4 w-4" style={{ color: STAFF_SILVER }} />
            {IT_HELP_DESK_LABEL}
          </a>
          <a
            href={getItHelpDeskMailto()}
            className="flex items-center gap-2 underline-offset-2 hover:underline"
            style={{ color: STAFF_NAVY }}
          >
            <Mail className="h-4 w-4" style={{ color: STAFF_SILVER }} />
            {IT_HELP_DESK_EMAIL}
          </a>
        </div>
      </Card>
    </div>
  )
}
