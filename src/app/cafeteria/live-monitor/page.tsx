"use client"

import { useEffect, useState } from "react"

export default function LiveMonitorPage() {
  const [mealsServed, setMealsServed] = useState(184)
  const [activeLineCount, setActiveLineCount] = useState(26)

  useEffect(() => {
    const interval = setInterval(() => {
      setMealsServed((prev) => prev + 1)

      setActiveLineCount(
        Math.floor(Math.random() * 35) + 5
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const estimatedWait =
    activeLineCount > 25
      ? "8-10 Minutes"
      : activeLineCount > 15
      ? "4-6 Minutes"
      : "1-3 Minutes"

  const cafeteriaStatus =
    activeLineCount > 25
      ? "High Volume"
      : activeLineCount > 15
      ? "Moderate Traffic"
      : "Normal Operations"

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Live Cafeteria Monitor
            </h1>

            <p className="mt-2 text-slate-400">
              Real-time cafeteria operational monitoring
            </p>
          </div>

          <div className="rounded-full border border-green-700 bg-green-950 px-4 py-2 text-sm font-semibold text-green-300">
            LIVE OPERATIONS
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Meals Served Today
            </div>

            <div className="mt-3 text-5xl font-bold text-blue-400">
              {mealsServed}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Active Line Count
            </div>

            <div className="mt-3 text-5xl font-bold text-yellow-400">
              {activeLineCount}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Estimated Wait Time
            </div>

            <div className="mt-3 text-3xl font-bold text-red-300">
              {estimatedWait}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Cafeteria Status
            </div>

            <div className="mt-3 text-3xl font-bold text-green-400">
              {cafeteriaStatus}
            </div>

          </div>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-3xl font-bold">
                Live Operational Overview
              </h2>

              <p className="mt-2 text-slate-400">
                Current cafeteria throughput and lunch period monitoring
              </p>
            </div>

            <div
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                activeLineCount > 25
                  ? "border border-red-700 bg-red-950 text-red-300"
                  : activeLineCount > 15
                  ? "border border-yellow-700 bg-yellow-950 text-yellow-300"
                  : "border border-green-700 bg-green-950 text-green-300"
              }`}
            >
              {cafeteriaStatus}
            </div>

          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">

              <div className="text-sm text-slate-400">
                Scan Stations Active
              </div>

              <div className="mt-3 text-5xl font-bold text-green-400">
                3
              </div>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">

              <div className="text-sm text-slate-400">
                Current Lunch Period
              </div>

              <div className="mt-3 text-3xl font-bold text-blue-400">
                Grade 10
              </div>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">

              <div className="text-sm text-slate-400">
                Average Service Speed
              </div>

              <div className="mt-3 text-3xl font-bold text-yellow-400">
                12 sec
              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}