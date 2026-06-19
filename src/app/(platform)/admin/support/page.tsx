import { AuditLogTable } from "@/components/admin/AuditLogTable"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Headphones } from "lucide-react"

export default function AdminSupportPage() {
  return (
    <AdminModulePage
      section="Support"
      title="Support Center"
      description="Audit trail, system activity, and compliance records."
      icon={Headphones}
    >
      <AuditLogTable filterUserActions />
    </AdminModulePage>
  )
}
