"use client"

import { StaffAnnouncements } from "@/components/staff/StaffAnnouncements"
import { STAFF_BG, STAFF_NAVY } from "@/components/staff/layout/staff-theme"

export function StaffAnnouncementsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Announcements
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Lunch communication — menu changes, special meals, and schedule updates
        </p>
      </div>
      <StaffAnnouncements />
    </div>
  )
}
