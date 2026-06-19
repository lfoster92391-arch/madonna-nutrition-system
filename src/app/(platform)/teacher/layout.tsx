import { TeacherAuthGuard } from "@/components/auth/TeacherAuthGuard"
import { TeacherLayoutShell } from "@/components/teacher/layout/TeacherLayoutShell"
import { TeacherDataProvider } from "@/components/providers/TeacherDataProvider"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherAuthGuard>
      <TeacherDataProvider>
        <TeacherLayoutShell>{children}</TeacherLayoutShell>
      </TeacherDataProvider>
    </TeacherAuthGuard>
  )
}
