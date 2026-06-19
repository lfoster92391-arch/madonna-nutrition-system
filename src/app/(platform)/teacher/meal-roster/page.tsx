import { TeacherMealRosterView } from "@/components/teacher/TeacherMealRosterView"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherMealRosterPage() {
  return (
    <div style={{ backgroundColor: TEACHER_BG }}>
      <TeacherMealRosterView />
    </div>
  )
}
