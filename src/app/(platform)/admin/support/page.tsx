import { AuditLogTable } from "@/components/admin/AuditLogTable"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { AdminSecurityNote } from "@/components/admin/AdminSecurityNote"
import { SupportContactList } from "@/components/support/SupportNeedHelp"
import { ADMIN_NAVY, ADMIN_SILVER, ADMIN_WHITE } from "@/components/admin/layout/admin-theme"
import { Headphones } from "lucide-react"

export default function AdminSupportPage() {
  return (
    <AdminModulePage
      section="Support"
      title="Support Center"
      description="Mrs. Morris and Mrs. Dalfol — the only contacts for Fuel The Dons help."
      icon={Headphones}
    >
      <div className="space-y-6">
        <section
          className="rounded-2xl border p-4 sm:p-5"
          style={{ borderColor: ADMIN_SILVER, backgroundColor: ADMIN_WHITE }}
        >
          <h2 className="text-lg font-bold" style={{ color: ADMIN_NAVY }}>
            Contacts
          </h2>
          <p className="mt-1 mb-4 text-sm" style={{ color: ADMIN_SILVER }}>
            Email Mrs. Morris or Mrs. Dalfol. There is no separate IT Help Desk mailbox.
          </p>
          <SupportContactList linkStyle={{ color: ADMIN_NAVY }} />
        </section>
        <AdminSecurityNote />
        <AuditLogTable filterUserActions />
      </div>
    </AdminModulePage>
  )
}
