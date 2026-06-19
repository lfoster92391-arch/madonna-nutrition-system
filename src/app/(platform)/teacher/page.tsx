"use client"

import { TeacherCalendarPreview } from "@/components/teacher/TeacherCalendarPreview"
import { TeacherDashboardAnnouncements } from "@/components/teacher/TeacherDashboardAnnouncements"
import { TeacherFindStudentSection } from "@/components/teacher/TeacherFindStudentSection"
import { TeacherQuickAccessCards } from "@/components/teacher/TeacherQuickAccessCards"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8 p-6" style={{ backgroundColor: TEACHER_BG }}>
      <TeacherFindStudentSection />
      <TeacherQuickAccessCards />
      <TeacherCalendarPreview />
      <TeacherDashboardAnnouncements />
    </div>
  )
}
