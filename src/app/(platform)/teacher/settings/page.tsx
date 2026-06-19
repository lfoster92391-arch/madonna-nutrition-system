import { TeacherSettingsView } from "@/components/teacher/TeacherSettingsView"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherSettingsPage() {
  return (
    <div style={{ backgroundColor: TEACHER_BG }}>
      <TeacherSettingsView />
    </div>
  )
}
