import { AuditLogTable } from "@/components/admin/AuditLogTable"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { AdminSecurityNote } from "@/components/admin/AdminSecurityNote"
import { Headphones } from "lucide-react"

export default function AdminSupportPage() {
  return (
    <AdminModulePage
      section="Support"
      title="Support Center"
      description="Audit trail, system activity, and compliance records."
      icon={Headphones}
    >
      <div className="space-y-6">
        <AdminSecurityNote />
        <AuditLogTable filterUserActions />
      </div>
    </AdminModulePage>
  )
}
