import { TeacherAuthGuard } from "@/components/auth/TeacherAuthGuard"
import { TeacherSidebar } from "@/components/layout/TeacherSidebar"
import { TeacherDataProvider } from "@/components/providers/TeacherDataProvider"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherAuthGuard>
      <TeacherDataProvider>
        <div className="teacher-portal flex min-h-screen bg-white">
          <TeacherSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </TeacherDataProvider>
    </TeacherAuthGuard>
  )
}
