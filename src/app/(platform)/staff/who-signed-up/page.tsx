"use client"

import { WhoSignedUpForLunch } from "@/components/lunch/WhoSignedUpForLunch"
import { STAFF_BG, STAFF_NAVY } from "@/components/staff/layout/staff-theme"

export default function StaffWhoSignedUpPage() {
  return (
    <WhoSignedUpForLunch
      portalLabel="Staff"
      accentColor={STAFF_NAVY}
      backgroundColor={STAFF_BG}
      signUpHref="/staff/sign-up-student"
    />
  )
}
