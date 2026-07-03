import { TeacherAuthGuard } from "@/components/auth/TeacherAuthGuard"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"
import { TeacherLayoutShell } from "@/components/teacher/layout/TeacherLayoutShell"
import { TeacherDataProvider } from "@/components/providers/TeacherDataProvider"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherAuthGuard>
      <TeacherDataProvider>
        <MustChangePasswordGate>
          <TeacherLayoutShell>{children}</TeacherLayoutShell>
        </MustChangePasswordGate>
      </TeacherDataProvider>
    </TeacherAuthGuard>
  )
}
