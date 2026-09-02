import { NextResponse } from "next/server"
import { isDatabaseEnabled } from "@/lib/db/config"
import { parseMonthParam } from "@/lib/dates/month-range"
import {
  computeAnalytics,
  computeDashboard,
  computeReconciliation,
  mockAnalytics,
  mockDashboard,
  mockReconciliation,
  tryCompute,
} from "@/lib/intelligence/compute"
import {
  analyticsToCsv,
  dashboardToCsv,
  reconciliationToCsv,
} from "@/lib/intelligence/export-csv"

const EXPORT_TYPES = ["dashboard", "reconciliation", "analytics"] as const
type ExportType = (typeof EXPORT_TYPES)[number]

function isExportType(value: string | null): value is ExportType {
  return EXPORT_TYPES.includes(value as ExportType)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const month = parseMonthParam(url.searchParams.get("month")) ?? undefined

  if (!isExportType(type)) {
    return NextResponse.json(
      { error: "Invalid type. Use dashboard, reconciliation, or analytics." },
      { status: 400 }
    )
  }

  let csv = ""
  let filename = "report.csv"

  if (type === "dashboard") {
    const data = !isDatabaseEnabled()
      ? mockDashboard
      : await tryCompute(computeDashboard, mockDashboard)
    csv = dashboardToCsv(data)
    filename = "intelligence-dashboard.csv"
  } else if (type === "reconciliation") {
    const data = !isDatabaseEnabled()
      ? { ...mockReconciliation, month: month ?? mockReconciliation.month }
      : await tryCompute(
          () => computeReconciliation(month),
          { ...mockReconciliation, month: month ?? mockReconciliation.month }
        )
    csv = reconciliationToCsv(data)
    filename = "finance-reconciliation.csv"
  } else {
    const data = !isDatabaseEnabled()
      ? mockAnalytics
      : await tryCompute(computeAnalytics, mockAnalytics)
    csv = analyticsToCsv(data)
    filename = "reporting-analytics.csv"
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
