import { TeacherMessagesView } from "@/components/teacher/TeacherMessagesView"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherMessagesPage() {
  return (
    <div style={{ backgroundColor: TEACHER_BG }}>
      <TeacherMessagesView />
    </div>
  )
}
