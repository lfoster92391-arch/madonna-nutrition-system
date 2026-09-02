"use client"

import { Suspense, useMemo } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BarChart3, Download, FileSpreadsheet } from "lucide-react"
import { ExecutiveSummaryReport } from "@/components/admin/ExecutiveSummaryReport"
import { MonthPicker } from "@/components/admin/MonthPicker"
import { downloadReportCsv } from "@/lib/export/download-report"
import { currentMonthParam, parseMonthParam } from "@/lib/dates/month-range"
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
    href: "/admin/analytics",
  },
]

function AdminReportingPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const selectedMonth =
    parseMonthParam(searchParams.get("month")) ?? currentMonthParam()

  const setSelectedMonth = (month: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (month === currentMonthParam()) params.delete("month")
    else params.set("month", month)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const financeHref = useMemo(() => {
    const params = new URLSearchParams()
    if (selectedMonth !== currentMonthParam()) params.set("month", selectedMonth)
    params.set("tab", "reports")
    return `/admin/finance?${params.toString()}`
  }, [selectedMonth])

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-8">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-primary">
            <BarChart3 className="h-8 w-8" />
            Reporting
          </h1>
          <p className="text-silver-foreground">
            Executive summary and CSV exports from live database metrics.
          </p>
        </div>

        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />

        <ExecutiveSummaryReport month={selectedMonth} />

        <div className="grid gap-4 md:grid-cols-3 print:hidden">
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
                  onClick={() => downloadReportCsv(report.type, selectedMonth)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href={report.type === "reconciliation" ? financeHref : report.href}>
                    Open report
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminReportingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-silver-foreground">
          Loading reporting…
        </div>
      }
    >
      <AdminReportingPageInner />
    </Suspense>
  )
}
