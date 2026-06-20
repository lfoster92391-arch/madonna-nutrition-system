"use client"

import Link from "next/link"
import { BarChart3, Download, FileSpreadsheet } from "lucide-react"
import { downloadReportCsv } from "@/lib/export/download-report"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const REPORTS = [
  {
    title: "Operations Intelligence",
    description: "Dashboard metrics, revenue trend, and participation.",
    type: "dashboard" as const,
    href: "/admin/intelligence",
  },
  {
    title: "Financial Reconciliation",
    description: "Card, receipt, and inventory matching summary.",
    type: "reconciliation" as const,
    href: "/admin/finance",
  },
  {
    title: "Analytics & Reporting",
    description: "Participation, waste breakdown, vendor and nutrition insights.",
    type: "analytics" as const,
    href: "/admin/reporting",
  },
]

export default function AdminReportingPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-primary">
            <BarChart3 className="h-8 w-8" />
            Reporting
          </h1>
          <p className="text-silver-foreground">
            Export operational and financial reports as CSV from live database metrics.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REPORTS.map((report) => (
            <Card key={report.type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileSpreadsheet className="h-5 w-5" />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <div className="flex flex-wrap gap-2 px-6 pb-6">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReportCsv(report.type)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={report.href}>Open report</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
