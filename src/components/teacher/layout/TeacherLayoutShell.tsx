"use client"

import { TeacherLunchActivityPanel } from "@/components/teacher/layout/TeacherLunchActivityPanel"
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar"
import { TeacherTopBar } from "@/components/teacher/layout/TeacherTopBar"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export function TeacherLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="teacher-portal flex h-screen flex-col" style={{ backgroundColor: TEACHER_BG }}>
      <div className="flex min-h-0 flex-1">
        <TeacherSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopBar />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
            <TeacherLunchActivityPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
