"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, Line } from "react-chartjs-2"
import { Brain, Download } from "lucide-react"
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell"
import { MetricCard } from "@/components/intelligence/MetricCard"
import { RefreshIndicator } from "@/components/intelligence/RefreshIndicator"
import { AiSuggestionsPanel } from "@/components/intelligence/AiSuggestionsPanel"
import { SeasonalMemorySection } from "@/components/intelligence/SeasonalMemorySection"
import { ensureChartsRegistered, chartColors } from "@/components/intelligence/chart-setup"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { DashboardData } from "@/lib/intelligence/types"
import { downloadReportCsv } from "@/lib/export/download-report"
import { formatCurrency } from "@/lib/utils"

ensureChartsRegistered()

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/intelligence/dashboard")
  if (!res.ok) throw new Error("Failed to load dashboard")
  return res.json()
}

export default function AdminIntelligencePage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "dashboard"],
    queryFn: fetchDashboard,
  })

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["intelligence", "dashboard"] })
  }, [queryClient])

  const m = data?.metrics

  return (
    <IntelligenceShell
      section="Intelligence"
      title="Operations Intelligence"
      description="Real-time dashboard synthesizing meals, balances, inventory, and forecasts."
      icon={Brain}
      source={data?.source}
      actions={
        <>
          <RefreshIndicator refreshedAt={data?.refreshedAt} onRefresh={refresh} />
          <Button variant="outline" size="sm" type="button" onClick={() => downloadReportCsv("dashboard")}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </>
      }
    >
      {isLoading && <p className="text-[#AEB6C2]">Loading dashboard…</p>}
      {m && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Revenue Today" value={formatCurrency(m.revenueToday)} variant="success" />
          <MetricCard label="Inventory Health" value={`${m.inventoryHealth}%`} hint={`${m.lowStockCount} low stock`} />
          <MetricCard label="Forecast" value={m.forecastSummary.split(" ")[0]} hint={m.forecastSummary} />
          <MetricCard label="Waste" value={`${m.wastePercent}%`} variant={m.wastePercent > 5 ? "warning" : "success"} />
          <MetricCard label="Participation" value={String(m.participationCount)} hint="meals today" />
          <MetricCard label="SKUs Tracked" value={String(m.totalInventoryItems)} />
        </div>
      )}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">Revenue Trend</CardTitle>
            </CardHeader>
            <div className="h-64 px-4 pb-4">
              <Line
                data={{
                  labels: data.revenueTrend.labels,
                  datasets: [{
                    label: "Revenue",
                    data: data.revenueTrend.values,
                    borderColor: chartColors.navy,
                    backgroundColor: chartColors.navyLight,
                    tension: 0.35,
                    fill: true,
                  }],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </Card>
          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">Meals by Type</CardTitle>
            </CardHeader>
            <div className="h-64 px-4 pb-4">
              <Bar
                data={{
                  labels: data.mealsByType.labels,
                  datasets: [{
                    label: "Meals",
                    data: data.mealsByType.values,
                    backgroundColor: chartColors.navy,
                    borderRadius: 8,
                  }],
                }}
                options={{ responsive: true, maintainAspectRatio: false }}
              />
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AiSuggestionsPanel />
        <SeasonalMemorySection />
      </div>
    </IntelligenceShell>
  )
}
