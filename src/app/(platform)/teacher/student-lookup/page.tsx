import { TeacherFindStudentSection } from "@/components/teacher/TeacherFindStudentSection"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherStudentLookupPage() {
  return (
    <div className="p-6" style={{ backgroundColor: TEACHER_BG }}>
      <TeacherFindStudentSection />
    </div>
  )
}
