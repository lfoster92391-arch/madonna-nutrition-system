import { AdminLayoutShell } from "@/components/admin/layout/AdminLayoutShell"
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard"
import { MustChangePasswordGate } from "@/components/auth/MustChangePasswordGate"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <MustChangePasswordGate>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </MustChangePasswordGate>
    </AdminAuthGuard>
  )
}
