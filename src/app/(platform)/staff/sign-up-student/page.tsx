"use client"

import { WorkplaceStudentLunchSignup } from "@/components/lunch/WorkplaceStudentLunchSignup"
import { STAFF_BG, STAFF_NAVY } from "@/components/staff/layout/staff-theme"

export default function StaffSignUpStudentPage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: STAFF_BG }}>
      <WorkplaceStudentLunchSignup
        portalLabel="Staff"
        accentColor={STAFF_NAVY}
        rosterHref="/staff/who-signed-up"
      />
    </div>
  )
}
