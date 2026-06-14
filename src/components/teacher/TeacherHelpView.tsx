"use client"

import { HelpCircle, Mail, Phone } from "lucide-react"
import { TeacherDashboardHeader } from "@/components/teacher/TeacherDashboardHeader"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"

export function TeacherHelpView() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <TeacherDashboardHeader subtitle="Help & Support" />
      <div className="p-8">
        <Card className="max-w-2xl rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
            <HelpCircle className="h-5 w-5" />
            Need Assistance?
          </h2>
          <p className="mt-3 text-sm text-silver-foreground">
            Contact the Madonna Nutrition Office for badge issues, student signup help, or account
            questions. Teachers cannot view student balances or allergy records.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
              <Phone className="h-4 w-4" style={{ color: "#AEB6C2" }} />
              Nutrition Office: (304) 555-0199
            </p>
            <p className="flex items-center gap-2" style={{ color: TEACHER_NAVY }}>
              <Mail className="h-4 w-4" style={{ color: "#AEB6C2" }} />
              nutrition@weirtonmadonna.org
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
