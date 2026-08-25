"use client"

import { WorkplaceStudentLunchSignup } from "@/components/lunch/WorkplaceStudentLunchSignup"
import { ADMIN_NAVY } from "@/components/admin/layout/admin-theme"

export default function AdminSignUpStudentPage() {
  return (
    <div className="min-h-full bg-white">
      <WorkplaceStudentLunchSignup portalLabel="Admin" accentColor={ADMIN_NAVY} />
    </div>
  )
}
