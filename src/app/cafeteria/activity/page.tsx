"use client"

import { mockActivity } from "@/data/mockActivity"

export default function ActivityPage() {
  function getStatusStyles(type: string) {
    switch (type) {
      case "critical":
        return "border-red-700 bg-red-950 text-red-300"

      case "warning":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"

      default:
        return "border-blue-700 bg-blue-950 text-blue-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-6xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Operational Activity Feed
            </h1>

            <p className="mt-2 text-slate-400">
              Live cafeteria operational event monitoring
            </p>
          </div>

          <div className="rounded-full border border-blue-700 bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
            {mockActivity.length} Events Logged
          </div>

        </div>

        <div className="space-y-4">

          {mockActivity.map((activity) => (
            <div
              key={activity.id}
              className={`rounded-2xl border p-6 ${getStatusStyles(
                activity.type
              )}`}
            >

              <div className="flex items-start justify-between gap-6">

                <div className="space-y-3">

                  <div>
                    <h2 className="text-2xl font-bold">
                      {activity.event}
                    </h2>

                    <p className="mt-2 leading-7">
                      {activity.description}
                    </p>
                  </div>

                  <div className="text-sm opacity-80">
                    {activity.timestamp}
                  </div>

                </div>

                <div className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {activity.type}
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>
    </main>
  )
}