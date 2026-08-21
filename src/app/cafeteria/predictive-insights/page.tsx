"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { INTELLIGENCE_REFETCH_MS } from "@/lib/intelligence/refresh"
import type { ForecastData } from "@/lib/intelligence/types"

async function fetchForecast(): Promise<ForecastData> {
  const res = await fetch("/api/intelligence/forecast")
  if (!res.ok) throw new Error("Failed to load forecast")
  return res.json()
}

export default function PredictiveInsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "forecast"],
    queryFn: fetchForecast,
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })

  const insights = useMemo(() => {
    if (!data) return [] as Array<{ id: string; title: string; prediction: string; severity: string }>
    const rows: Array<{ id: string; title: string; prediction: string; severity: string }> = []

    if (data.nextWeekMeals > 0) {
      rows.push({
        id: "next-week-meals",
        title: "Next week meal demand",
        prediction: `About ${data.nextWeekMeals} meals projected next week (confidence ${data.confidence}%).`,
        severity: "info",
      })
    }

    if (data.wasteForecastPercent > 0) {
      rows.push({
        id: "waste-forecast",
        title: "Waste outlook",
        prediction: `Projected waste share near ${data.wasteForecastPercent}% based on recent kitchen logs.`,
        severity: data.wasteForecastPercent > 5 ? "warning" : "info",
      })
    }

    for (const item of data.depletion.slice(0, 5)) {
      rows.push({
        id: `depletion-${item.itemName}`,
        title: `${item.itemName} running low`,
        prediction: `About ${item.daysUntilThreshold} day(s) until threshold (${item.currentQty} on hand; threshold ${item.threshold}).`,
        severity: item.daysUntilThreshold <= 2 ? "critical" : "warning",
      })
    }

    for (const suggestion of data.orderSuggestions.slice(0, 5)) {
      rows.push({
        id: `order-${suggestion.item}`,
        title: `Order suggestion: ${suggestion.item}`,
        prediction: suggestion.reason,
        severity: "warning",
      })
    }

    return rows
  }, [data])

  function getStyles(severity: string) {
    switch (severity) {
      case "critical":
        return "border-red-700 bg-red-950 text-red-300"
      case "warning":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"
      default:
        return "border-blue-700 bg-blue-950 text-blue-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Predictive Operational Insights</h1>
            <p className="mt-2 text-slate-400">
              Forecasting cafeteria operational risks and trends from live participation and inventory
            </p>
          </div>
          <div className="rounded-full border border-blue-700 bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
            {isLoading ? "Loading…" : insights.length === 0 ? "No forecasts yet" : `${insights.length} insights`}
          </div>
        </div>

        <div className="grid gap-6">
          {insights.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-slate-400">
              No predictive insights yet — data appears after real cafeteria activity is recorded.
            </div>
          ) : null}

          {insights.map((insight) => (
            <div key={insight.id} className={`rounded-2xl border p-6 ${getStyles(insight.severity)}`}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold">{insight.title}</h2>
                  <p className="mt-4 text-lg leading-8">{insight.prediction}</p>
                </div>
                <div className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
                  {insight.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
