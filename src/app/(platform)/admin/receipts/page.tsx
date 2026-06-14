"use client"

import { Receipt } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DEMO_RECEIPT_SCANS } from "@/data/demo/operations"

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  pending: "default",
  unmatched: "warning",
  matched: "success",
}

export default function AdminReceiptsPage() {
  const unmatched = DEMO_RECEIPT_SCANS.filter((r) => r.status === "unmatched").length

  return (
    <AdminModulePage
      section="Operations"
      title="Receipts"
      description="OCR receipt scans matched to receiving records for audit trail."
      icon={Receipt}
      stats={[
        { label: "Unmatched", value: String(unmatched), variant: unmatched ? "warning" : "success" },
        { label: "Total Scans", value: String(DEMO_RECEIPT_SCANS.length) },
      ]}
    >
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Receipt Inbox</CardTitle>
          <Button size="sm" variant="outline">
            Upload Receipt
          </Button>
        </CardHeader>
        <div className="space-y-3">
          {DEMO_RECEIPT_SCANS.map((scan) => (
            <div
              key={scan.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-silver/40 p-4"
            >
              <div>
                <p className="font-semibold text-primary">{scan.fileName}</p>
                {scan.vendorGuess && (
                  <p className="text-sm text-silver-foreground">Vendor: {scan.vendorGuess}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[scan.status] ?? "default"}>{scan.status}</Badge>
                <span className="text-xs text-silver-foreground">
                  {new Date(scan.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminModulePage>
  )
}
