"use client"

import { mockTemperatures } from "@/data/mockTemperatures"

export default function TemperaturePage() {
  function getStatusStyles(status: string) {
    switch (status) {
      case "critical":
        return "border-red-700 bg-red-950 text-red-300"

      case "warning":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"

      default:
        return "border-green-700 bg-green-950 text-green-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">

        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Temperature Monitoring
          </h1>

          <p className="mt-2 text-slate-400">
            Cafeteria food safety and temperature compliance logs
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">

          {mockTemperatures.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    {entry.location}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Safe Range: {entry.safeRange}
                  </p>
                </div>

                <div
                  className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(
                    entry.status
                  )}`}
                >
                  {entry.status}
                </div>

              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <div className="text-sm text-slate-400">
                    Current Temperature
                  </div>

                  <div
                    className={`mt-3 text-5xl font-bold ${
                      entry.status === "critical"
                        ? "text-red-400"
                        : entry.status === "warning"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {entry.temperature}°
                  </div>

                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <div className="text-sm text-slate-400">
                    Last Checked
                  </div>

                  <div className="mt-3 text-xl font-semibold">
                    {entry.lastChecked}
                  </div>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  )
}