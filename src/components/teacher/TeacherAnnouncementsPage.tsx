"use client"

import { TeacherAnnouncements } from "@/components/teacher/TeacherAnnouncements"
import { TeacherDashboardHeader } from "@/components/teacher/TeacherDashboardHeader"

export function TeacherAnnouncementsPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <TeacherDashboardHeader subtitle="Announcements" />
      <div className="p-8">
        <TeacherAnnouncements />
      </div>
    </div>
  )
}
