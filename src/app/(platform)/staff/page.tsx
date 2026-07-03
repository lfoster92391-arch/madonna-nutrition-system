"use client"

import { StaffCalendarPreview } from "@/components/staff/StaffCalendarPreview"
import { StaffDashboardAnnouncements } from "@/components/staff/StaffDashboardAnnouncements"
import { StaffQuickAccessCards } from "@/components/staff/StaffQuickAccessCards"
import { STAFF_BG } from "@/components/staff/layout/staff-theme"

export default function StaffDashboardPage() {
  return (
    <div
      className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:gap-8"
      style={{ backgroundColor: STAFF_BG }}
    >
      <div className="md:hidden">
        <StaffDashboardAnnouncements />
      </div>
      <StaffQuickAccessCards />
      <StaffCalendarPreview />
      <div className="hidden md:block">
        <StaffDashboardAnnouncements />
      </div>
    </div>
  )
}
