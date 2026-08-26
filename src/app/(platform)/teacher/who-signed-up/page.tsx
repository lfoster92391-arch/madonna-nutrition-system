"use client"

import { WhoSignedUpForLunch } from "@/components/lunch/WhoSignedUpForLunch"
import { TEACHER_BG, TEACHER_NAVY } from "@/components/teacher/layout/teacher-theme"

export default function TeacherWhoSignedUpPage() {
  return (
    <WhoSignedUpForLunch
      portalLabel="Teacher"
      accentColor={TEACHER_NAVY}
      backgroundColor={TEACHER_BG}
      signUpHref="/teacher/sign-up-student"
    />
  )
}
