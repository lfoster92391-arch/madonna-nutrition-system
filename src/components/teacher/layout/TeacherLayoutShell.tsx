"use client"

import { TeacherLunchActivityPanel } from "@/components/teacher/layout/TeacherLunchActivityPanel"
import { TeacherLayoutProvider } from "@/components/teacher/layout/teacher-layout-context"
import { TeacherSidebar } from "@/components/teacher/layout/TeacherSidebar"
import { TeacherTopBar } from "@/components/teacher/layout/TeacherTopBar"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export function TeacherLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <TeacherLayoutProvider>
      <div
        className="teacher-portal flex h-[100dvh] flex-col overflow-x-hidden"
        style={{ backgroundColor: TEACHER_BG }}
      >
        <div className="flex min-h-0 min-w-0 flex-1">
          <TeacherSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TeacherTopBar />
            <div className="flex min-h-0 min-w-0 flex-1">
              <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
              <TeacherLunchActivityPanel />
            </div>
          </div>
        </div>
      </div>
    </TeacherLayoutProvider>
  )
}
