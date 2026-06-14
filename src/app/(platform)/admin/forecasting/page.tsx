"use client"

import { useQuery } from "@tanstack/react-query"
import { Bar } from "react-chartjs-2"
import { LineChart } from "lucide-react"
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell"
import { MetricCard } from "@/components/intelligence/MetricCard"
import { ensureChartsRegistered, chartColors } from "@/components/intelligence/chart-setup"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ForecastData } from "@/lib/intelligence/types"

ensureChartsRegistered()

async function fetchForecast(): Promise<ForecastData> {
  const res = await fetch("/api/intelligence/forecast")
  if (!res.ok) throw new Error("Failed to load forecast")
  return res.json()
}

export default function AdminForecastingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "forecast"],
    queryFn: fetchForecast,
  })

  const maxMeals = Math.max(...(data?.demandByDay.values ?? [1]))

  return (
    <IntelligenceShell
      section="Intelligence"
      title="Forecast Center"
      description="Projections based on current participation, calendar events, and inventory — not ML predictions."
      icon={LineChart}
      source={data?.source}
    >
      {isLoading && <p className="text-[#AEB6C2]">Computing forecasts…</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Next Week Meals" value={String(data.nextWeekMeals)} />
            <MetricCard label="Confidence" value={`${data.confidence}%`} variant="success" />
            <MetricCard label="Waste Forecast" value={`${data.wasteForecastPercent}%`} variant="warning" />
          </div>

          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">5-Day Demand Forecast</CardTitle>
            </CardHeader>
            <div className="flex items-end gap-4 px-6 pb-6">
              {data.demandByDay.labels.map((day, i) => {
                const meals = data.demandByDay.values[i] ?? 0
                return (
                  <div key={day} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-sm font-bold text-[#041B52]">{meals}</span>
                    <div
                      className="w-full rounded-t-xl bg-[#041B52]/80"
                      style={{ height: `${(meals / maxMeals) * 160}px` }}
                    />
                    <span className="text-xs font-medium text-[#AEB6C2]">{day}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[20px] border-[#AEB6C2]/60">
              <CardHeader>
                <CardTitle className="text-[#041B52]">Inventory Depletion</CardTitle>
                <CardDescription>Days until par level at current usage rates</CardDescription>
              </CardHeader>
              <div className="space-y-3 px-6 pb-6">
                {data.depletion.map((row) => (
                  <div key={row.itemName} className="flex items-center justify-between rounded-xl border border-[#AEB6C2]/40 px-4 py-3">
                    <div>
                      <p className="font-medium text-[#041B52]">{row.itemName}</p>
                      <p className="text-xs text-[#AEB6C2]">{row.currentQty} on hand · par {row.threshold}</p>
                    </div>
                    <Badge variant={row.daysUntilThreshold <= 3 ? "danger" : "outline"}>
                      {row.daysUntilThreshold}d
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[20px] border-[#AEB6C2]/60">
              <CardHeader>
                <CardTitle className="text-[#041B52]">Participation Trend</CardTitle>
              </CardHeader>
              <div className="h-64 px-4 pb-4">
                <Bar
                  data={{
                    labels: data.participationTrend.labels,
                    datasets: [{
                      label: "Participation %",
                      data: data.participationTrend.values,
                      backgroundColor: chartColors.green,
                      borderRadius: 8,
                    }],
                  }}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
            </Card>
          </div>

          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">Order Suggestions</CardTitle>
              <CardDescription>Read-only recommendations — review in receiving workflow</CardDescription>
            </CardHeader>
            <div className="space-y-2 px-6 pb-6">
              {data.orderSuggestions.map((s) => (
                <div key={s.item} className="rounded-xl border border-[#AEB6C2]/40 px-4 py-3">
                  <p className="font-medium text-[#041B52]">{s.item}</p>
                  <p className="text-sm text-[#AEB6C2]">{s.reason}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </IntelligenceShell>
  )
}
