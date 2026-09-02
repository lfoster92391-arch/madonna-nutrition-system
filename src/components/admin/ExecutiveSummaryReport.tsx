"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { INTELLIGENCE_REFETCH_MS } from "@/lib/intelligence/refresh"
import type { AnalyticsData, DashboardData, ReconciliationData, SuggestionsData } from "@/lib/intelligence/types"
import { formatMonthLabel } from "@/lib/dates/month-range"
import { formatCurrency } from "@/lib/utils"

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}`)
  return res.json()
}

/**
 * Plain-language executive summary for Lisa — live intelligence only, no invented metrics.
 */
export function ExecutiveSummaryReport({ month }: { month: string }) {
  const dashboardQuery = useQuery({
    queryKey: ["intelligence", "dashboard"],
    queryFn: () => fetchJson<DashboardData>("/api/intelligence/dashboard"),
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })
  const reconciliationQuery = useQuery({
    queryKey: ["intelligence", "reconciliation", month],
    queryFn: () =>
      fetchJson<ReconciliationData>(
        `/api/intelligence/reconciliation?month=${encodeURIComponent(month)}`
      ),
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })
  const analyticsQuery = useQuery({
    queryKey: ["intelligence", "analytics"],
    queryFn: () => fetchJson<AnalyticsData>("/api/intelligence/analytics"),
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })
  const suggestionsQuery = useQuery({
    queryKey: ["intelligence", "suggestions"],
    queryFn: () => fetchJson<SuggestionsData>("/api/intelligence/suggestions"),
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })

  const loading =
    dashboardQuery.isLoading ||
    analyticsQuery.isLoading ||
    suggestionsQuery.isLoading ||
    reconciliationQuery.isLoading
  const dashboard = dashboardQuery.data
  const analytics = analyticsQuery.data
  const suggestions = suggestionsQuery.data
  const reconciliation = reconciliationQuery.data
  const m = dashboard?.metrics
  const monthLabel = formatMonthLabel(month)

  const paragraphs = useMemo(() => {
    if (!m || !analytics) return [] as string[]
    const lines: string[] = []
    const asOf = dashboard?.refreshedAt
      ? new Date(dashboard.refreshedAt).toLocaleString()
      : "just now"

    lines.push(`Executive cafeteria summary as of ${asOf}.`)
    lines.push(
      `Meals served today: ${m.participationCount}. Revenue today: ${formatCurrency(m.revenueToday)}.`
    )
    if (reconciliation) {
      lines.push(
        `Financials for ${monthLabel}: meal revenue ${formatCurrency(reconciliation.totalRevenue)}, grocery spend ${formatCurrency(reconciliation.totalExpenses)}, net ${formatCurrency(reconciliation.netMargin)}.`
      )
    }
    lines.push(
      `Participation rate: ${analytics.participationRate}%. Inventory health: ${m.inventoryHealth}% (${m.lowStockCount} low-stock items of ${m.totalInventoryItems} tracked).`
    )
    lines.push(
      `Low balances: ${m.lowBalanceCount} student account${m.lowBalanceCount === 1 ? "" : "s"} below $5. Debt / negative balances: ${m.negativeBalanceCount}.`
    )
    lines.push(
      `Waste this week: ${analytics.waste.weeklyTotalQty} units (~${formatCurrency(analytics.waste.weeklyEstimatedCost)}; ${analytics.waste.wastePercent}% of kitchen pull-down). Top reason: ${analytics.waste.reasons[0]?.reason ?? "none logged yet"}.`
    )
    if (suggestions?.suggestions?.length) {
      const top = suggestions.suggestions.slice(0, 3).map((s) => s.title).join("; ")
      lines.push(`Active smart alerts / suggestions: ${suggestions.suggestions.length}. Focus: ${top}.`)
    } else {
      lines.push("No smart alerts or AI suggestions are active right now.")
    }
    lines.push(`Forecast note: ${m.forecastSummary}`)
    return lines
  }, [analytics, dashboard?.refreshedAt, m, monthLabel, reconciliation, suggestions])

  return (
    <Card className="print:border-0 print:shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="text-xl text-primary">Executive summary</CardTitle>
          <CardDescription>
            Plain-language snapshot for leadership — refreshed about every 20 minutes from live
            operations data.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </CardHeader>
      <div className="space-y-3 px-6 pb-6">
        {loading && <p className="text-sm text-silver-foreground">Loading live metrics…</p>}
        {!loading && paragraphs.length === 0 && (
          <p className="text-sm text-silver-foreground">
            No live metrics yet. Connect the database and record cafeteria activity to populate this
            summary.
          </p>
        )}
        {paragraphs.map((line) => (
          <p key={line.slice(0, 48)} className="text-sm leading-relaxed text-primary">
            {line}
          </p>
        ))}
        {m && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
            <Metric label="Meals today" value={String(m.participationCount)} />
            <Metric label="Revenue today" value={formatCurrency(m.revenueToday)} />
            <Metric
              label="Participation"
              value={analytics ? `${analytics.participationRate}%` : "—"}
            />
            <Metric label="Waste (week)" value={`${analytics?.waste.wastePercent ?? 0}%`} />
          </div>
        )}
        {reconciliation && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            <Metric
              label={`Revenue (${monthLabel})`}
              value={formatCurrency(reconciliation.totalRevenue)}
            />
            <Metric
              label={`Groceries (${monthLabel})`}
              value={formatCurrency(reconciliation.totalExpenses)}
            />
            <Metric
              label={`Net (${monthLabel})`}
              value={formatCurrency(reconciliation.netMargin)}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-silver/40 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-silver-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
  )
}
