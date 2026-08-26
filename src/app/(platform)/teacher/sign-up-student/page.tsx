"use client"

import { WorkplaceStudentLunchSignup } from "@/components/lunch/WorkplaceStudentLunchSignup"
import { TEACHER_BG, TEACHER_NAVY } from "@/components/teacher/layout/teacher-theme"

export default function TeacherSignUpStudentPage() {
  return (
    <div className="min-h-full" style={{ backgroundColor: TEACHER_BG }}>
      <WorkplaceStudentLunchSignup
        portalLabel="Teacher"
        accentColor={TEACHER_NAVY}
        rosterHref="/teacher/who-signed-up"
      />
    </div>
  )
}
