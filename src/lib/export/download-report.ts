"use client"

export function downloadReportCsv(type: "dashboard" | "reconciliation" | "analytics") {
  const link = document.createElement("a")
  link.href = `/api/intelligence/export?type=${type}`
  link.download = `${type}-report.csv`
  link.click()
}
