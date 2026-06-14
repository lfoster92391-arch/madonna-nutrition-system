import { AuditLogTable } from "@/components/admin/AuditLogTable"

export default function AdminAuditLogPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl">
        <AuditLogTable filterUserActions />
      </div>
    </div>
  )
}
