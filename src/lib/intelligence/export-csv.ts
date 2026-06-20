import type {
  AnalyticsData,
  DashboardData,
  ReconciliationData,
} from "@/lib/intelligence/types"

function escapeCell(value: string | number): string {
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(escapeCell).join(",")]
  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","))
  }
  return lines.join("\n")
}

export function dashboardToCsv(data: DashboardData): string {
  const m = data.metrics
  const metricRows: (string | number)[][] = [
    ["Revenue Today", m.revenueToday],
    ["Inventory Health %", m.inventoryHealth],
    ["Forecast", m.forecastSummary],
    ["Waste %", m.wastePercent],
    ["Participation Count", m.participationCount],
    ["Low Stock Count", m.lowStockCount],
    ["Total Inventory Items", m.totalInventoryItems],
  ]

  const trendRows = data.revenueTrend.labels.map((label, i) => [
    label,
    data.revenueTrend.values[i] ?? 0,
  ])

  return [
    toCsv(["Metric", "Value"], metricRows),
    "",
    toCsv(["Day", "Revenue"], trendRows),
  ].join("\n")
}

export function reconciliationToCsv(data: ReconciliationData): string {
  const summary: (string | number)[][] = [
    ["Total Revenue", data.totalRevenue],
    ["Total Expenses", data.totalExpenses],
    ["Net Margin", data.netMargin],
  ]
  const detailRows = data.rows.map((row) => [
    row.label,
    row.cardAmount,
    row.receiptAmount,
    row.inventoryAmount,
    row.status,
  ])
  return [
    toCsv(["Metric", "Amount"], summary),
    "",
    toCsv(["Entry", "Card", "Receipt", "Inventory", "Status"], detailRows),
  ].join("\n")
}

export function analyticsToCsv(data: AnalyticsData): string {
  const b = data.waste.breakdown
  const rows: (string | number)[][] = [
    ["Participation Rate %", data.participationRate],
    ["Waste Prepared", b.prepared],
    ["Waste Served", b.served],
    ["Waste Saved", b.saved],
    ["Waste Expired", b.expired],
    ["Waste Discarded", b.discarded],
  ]
  const vendorRows = data.vendors.map((v) => [
    v.vendor,
    v.spend,
    v.orderCount,
    v.avgLeadDays,
    v.trend,
  ])
  const nutritionRows = data.nutrition.map((n) => [
    n.mealName,
    n.calories,
    n.allergens.join("; "),
    n.compliant ? "yes" : "no",
    n.notes,
  ])
  return [
    toCsv(["Metric", "Value"], rows),
    "",
    toCsv(["Vendor", "Spend", "Orders", "Avg Lead Days", "Trend"], vendorRows),
    "",
    toCsv(["Meal", "Calories", "Allergens", "Compliant", "Notes"], nutritionRows),
  ].join("\n")
}
