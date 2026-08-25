"use client"

import { WorkplaceHowToGuide } from "@/components/guides/WorkplaceHowToGuide"
import { TEACHER_BG, TEACHER_NAVY } from "@/components/teacher/layout/teacher-theme"

export default function TeacherGuidePage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: TEACHER_BG }}>
      <WorkplaceHowToGuide portal="teacher" accentColor={TEACHER_NAVY} />
    </div>
  )
}
