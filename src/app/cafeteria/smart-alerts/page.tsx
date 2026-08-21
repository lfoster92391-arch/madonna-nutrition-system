"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useDemo } from "@/components/providers/DemoProvider"
import { INTELLIGENCE_REFETCH_MS } from "@/lib/intelligence/refresh"
import type { SuggestionsData } from "@/lib/intelligence/types"

type LiveAlert = {
  type: string
  severity: "critical" | "warning" | "info"
  message: string
}

async function fetchSuggestions(): Promise<SuggestionsData> {
  const res = await fetch("/api/intelligence/suggestions")
  if (!res.ok) throw new Error("Failed to load suggestions")
  return res.json()
}

export default function SmartAlertsPage() {
  const { inventory, students, databaseEnabled } = useDemo()
  const { data: suggestions } = useQuery({
    queryKey: ["intelligence", "suggestions"],
    queryFn: fetchSuggestions,
    refetchInterval: INTELLIGENCE_REFETCH_MS,
    enabled: databaseEnabled,
  })

  const alerts = useMemo(() => {
    const rows: LiveAlert[] = []

    for (const item of inventory) {
      if (item.qty <= item.lowStockThreshold) {
        rows.push({
          type: "Inventory Alert",
          severity: item.qty <= 0 ? "critical" : "warning",
          message: `${item.name} inventory is at ${item.qty} (threshold ${item.lowStockThreshold}).`,
        })
      }
    }

    for (const student of students) {
      if (student.disabled) continue
      if (student.balance < 0) {
        rows.push({
          type: "Negative Balance",
          severity: "critical",
          message: `${student.firstName} ${student.lastName} has a negative cafeteria balance (${student.balance.toFixed(2)}).`,
        })
      } else if (student.balance < 5) {
        rows.push({
          type: "Low Balance",
          severity: "warning",
          message: `${student.firstName} ${student.lastName} is below $5 (${student.balance.toFixed(2)}).`,
        })
      }
    }

    for (const suggestion of suggestions?.suggestions ?? []) {
      rows.push({
        type: "Smart Suggestion",
        severity: suggestion.priority === "high" ? "critical" : "warning",
        message: `${suggestion.title}: ${suggestion.detail}`,
      })
    }

    return rows
  }, [inventory, students, suggestions])

  function getAlertStyles(severity: string) {
    switch (severity) {
      case "critical":
        return "border-red-700 bg-red-950 text-red-300"
      default:
        return "border-yellow-700 bg-yellow-950 text-yellow-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Smart Operational Alerts</h1>
            <p className="mt-2 text-slate-400">
              Live inventory, balance, and intelligence warnings from cafeteria data
            </p>
          </div>
          <div className="rounded-full border border-red-700 bg-red-950 px-4 py-2 text-sm font-semibold text-red-300">
            {alerts.length} Active Alerts
          </div>
        </div>

        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-slate-400">
              No active alerts — inventory and student balances look healthy.
            </div>
          ) : null}
          {alerts.map((alert, index) => (
            <div
              key={`${alert.type}-${index}`}
              className={`rounded-2xl border p-6 ${getAlertStyles(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
                    {alert.type}
                  </p>
                  <p className="mt-2 text-lg leading-8">{alert.message}</p>
                </div>
                <div className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
                  {alert.severity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
