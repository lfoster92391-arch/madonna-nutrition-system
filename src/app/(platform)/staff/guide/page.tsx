"use client"

import { WorkplaceHowToGuide } from "@/components/guides/WorkplaceHowToGuide"
import { STAFF_BG, STAFF_NAVY } from "@/components/staff/layout/staff-theme"

export default function StaffGuidePage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: STAFF_BG }}>
      <WorkplaceHowToGuide portal="staff" accentColor={STAFF_NAVY} />
    </div>
  )
}
