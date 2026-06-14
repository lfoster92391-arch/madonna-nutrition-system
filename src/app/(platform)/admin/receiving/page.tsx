"use client"

import { PackageCheck } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DEMO_RECEIVING } from "@/data/demo/operations"

const STATUS_LABELS = {
  draft: "default",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
} as const

export default function AdminReceivingPage() {
  const pending = DEMO_RECEIVING.filter((r) => r.status === "pending_approval").length

  return (
    <AdminModulePage
      section="Operations"
      title="Receiving"
      description="Track vendor deliveries, approve receipts, and post inventory."
      icon={PackageCheck}
      stats={[
        { label: "Pending Approval", value: String(pending), variant: pending ? "warning" : "success" },
        { label: "This Week", value: String(DEMO_RECEIVING.length), hint: "Delivery records" },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {DEMO_RECEIVING.map((record) => (
            <div key={record.id} className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-silver/40 p-4">
              <div>
                <p className="font-semibold text-primary">{record.vendorName}</p>
                {record.invoiceNumber && <p className="text-sm text-silver-foreground">Invoice {record.invoiceNumber}</p>}
                <p className="mt-2 text-sm text-silver-foreground">{record.lines.map((l) => `${l.quantity} ${l.unit} ${l.name}`).join(" · ")}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={STATUS_LABELS[record.status] ?? "default"}>{record.status.replace(/_/g, " ")}</Badge>
                <span className="text-xs text-silver-foreground">{new Date(record.receivedAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminModulePage>
  )
}