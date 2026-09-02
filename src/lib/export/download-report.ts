"use client"

export function downloadReportCsv(
  type: "dashboard" | "reconciliation" | "analytics",
  month?: string
) {
  const params = new URLSearchParams({ type })
  if (month) params.set("month", month)
  const link = document.createElement("a")
  link.href = `/api/intelligence/export?${params.toString()}`
  link.download = `${type}-report.csv`
  link.click()
}
