"use client"

import { mockInventory } from "@/data/mockInventory"
import { students } from "@/data/mockstudents"
import { mockTemperatures } from "@/data/mockTemperatures"
import { mockWaste } from "@/data/mockWaste"

export default function SmartAlertsPage() {
  const inventoryAlerts = mockInventory
    .filter(
      (item) =>
        item.quantity <= item.lowStockThreshold
    )
    .map((item) => ({
      type: "Inventory Alert",
      severity: "warning",
      message: `${item.itemName} inventory is below threshold.`,
    }))

  const balanceAlerts = students
    .filter((student: any) => student.balance < 0)
    .map((student: any) => ({
      type: "Negative Balance",
      severity: "critical",
      message: `${student.firstName} ${student.lastName} has a negative cafeteria balance.`,
    }))

  const temperatureAlerts = mockTemperatures
    .filter(
      (entry) => entry.status !== "safe"
    )
    .map((entry) => ({
      type: "Temperature Warning",
      severity:
        entry.status === "critical"
          ? "critical"
          : "warning",
      message: `${entry.location} temperature is outside safe range.`,
    }))

  const wasteAlerts = mockWaste
    .filter(
      (entry) => entry.quantityWasted > 10
    )
    .map((entry) => ({
      type: "Waste Alert",
      severity: "warning",
      message: `${entry.itemName} waste exceeded recommended levels.`,
    }))

  const alerts = [
    ...inventoryAlerts,
    ...balanceAlerts,
    ...temperatureAlerts,
    ...wasteAlerts,
  ]

  function getAlertStyles(severity: string) {
    switch (severity) {
      case "critical":
        return "border-red-700 bg-red-950 text-red-300"

      default:
        return "border-yellow-700 bg-yellow-950 text-yellow-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-6xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Smart Operational Alerts
            </h1>

            <p className="mt-2 text-slate-400">
              Automated cafeteria intelligence and system-generated warnings
            </p>
          </div>

          <div className="rounded-full border border-red-700 bg-red-950 px-4 py-2 text-sm font-semibold text-red-300">
            {alerts.length} Active Alerts
          </div>

        </div>

        <div className="space-y-4">

          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`rounded-2xl border p-6 ${getAlertStyles(
                alert.severity
              )}`}
            >

              <div className="flex items-start justify-between gap-6">

                <div>
                  <h2 className="text-2xl font-bold">
                    {alert.type}
                  </h2>

                  <p className="mt-2 leading-7">
                    {alert.message}
                  </p>
                </div>

                <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
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