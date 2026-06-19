"use client"

import { TeacherAnnouncements } from "@/components/teacher/TeacherAnnouncements"
import { TEACHER_BG, TEACHER_NAVY } from "@/components/teacher/layout/teacher-theme"

export function TeacherAnnouncementsPage() {
  return (
    <div className="space-y-6 p-6" style={{ backgroundColor: TEACHER_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Announcements
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Lunch communication — menu changes, special meals, and schedule updates
        </p>
      </div>
      <TeacherAnnouncements />
    </div>
  )
}
