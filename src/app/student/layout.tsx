import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"
import { StudentAuthGuard } from "@/components/auth/StudentAuthGuard"
import { StudentPortalShell } from "@/components/student/StudentPortalShell"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentAuthGuard>
      <MustChangePasswordGate>
        <StudentPortalShell>{children}</StudentPortalShell>
      </MustChangePasswordGate>
    </StudentAuthGuard>
  )
}
