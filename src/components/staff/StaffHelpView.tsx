"use client"

import { HelpCircle, Mail, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"

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
          Need Assistance?
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Contact the Madonna Nutrition Office for badge issues, account questions, or lunch
          schedule updates. Staff can view their own cafeteria account balance and published menu
          information.
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <p className="flex items-center gap-2" style={{ color: STAFF_NAVY }}>
            <Phone className="h-4 w-4" style={{ color: STAFF_SILVER }} />
            Nutrition Office: (304) 555-0199
          </p>
          <p className="flex items-center gap-2" style={{ color: STAFF_NAVY }}>
            <Mail className="h-4 w-4" style={{ color: STAFF_SILVER }} />
            nutrition@weirtonmadonna.org
          </p>
        </div>
      </Card>
    </div>
  )
}
