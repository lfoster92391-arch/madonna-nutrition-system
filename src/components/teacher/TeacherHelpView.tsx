"use client"

import { HelpCircle, Mail, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_BG, TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

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
          Need Assistance?
        </h2>
        <p className="mt-3 text-sm text-silver-foreground">
          Contact the Madonna Nutrition Office for badge issues, student signup help, or lunch
          schedule questions. Teachers cannot view student balances, allergy records, or account
          controls.
        </p>
        <div className="mt-6 space-y-3 text-sm">
          <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
            <Phone className="h-4 w-4" style={{ color: TEACHER_SILVER }} />
            Nutrition Office: (304) 555-0199
          </p>
          <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
            <Mail className="h-4 w-4" style={{ color: TEACHER_SILVER }} />
            nutrition@weirtonmadonna.org
          </p>
        </div>
      </Card>
    </div>
  )
}
