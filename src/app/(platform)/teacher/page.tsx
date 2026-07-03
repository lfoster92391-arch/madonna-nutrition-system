"use client"

import { TeacherCalendarPreview } from "@/components/teacher/TeacherCalendarPreview"
import { TeacherDashboardAnnouncements } from "@/components/teacher/TeacherDashboardAnnouncements"
import { TeacherFindStudentSection } from "@/components/teacher/TeacherFindStudentSection"
import { TeacherQuickAccessCards } from "@/components/teacher/TeacherQuickAccessCards"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherDashboardPage() {
  return (
    <div
      className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:gap-8"
      style={{ backgroundColor: TEACHER_BG }}
    >
      <div className="md:hidden">
        <TeacherDashboardAnnouncements />
      </div>
      <TeacherFindStudentSection />
      <TeacherQuickAccessCards />
      <TeacherCalendarPreview />
      <div className="hidden md:block">
        <TeacherDashboardAnnouncements />
      </div>
    </div>
  )
}
