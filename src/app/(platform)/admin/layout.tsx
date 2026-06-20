import { AdminLayoutShell } from "@/components/admin/layout/AdminLayoutShell"
import { AdminAuthGuard } from "@/components/auth/AdminAuthGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminAuthGuard>
  )
}
