"use client"

import { useState } from "react"
import { mockWaste } from "@/data/mockWaste"

export default function WastePage() {
  const [wasteLogs, setWasteLogs] = useState(mockWaste)

  function addWasteEntry() {
    const newEntry = {
      id: wasteLogs.length + 1,
      itemName: "French Fries",
      quantityWasted: 4,
      reason: "Overproduction",
      date: new Date().toISOString().split("T")[0],
    }

    setWasteLogs((prev) => [newEntry, ...prev])
  }

  const totalWaste = wasteLogs.reduce(
    (total, item) => total + item.quantityWasted,
    0
  )

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Waste Management
            </h1>

            <p className="mt-2 text-slate-400">
              Cafeteria food waste tracking and reporting
            </p>
          </div>

          <button
            onClick={addWasteEntry}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
          >
            Log Waste Entry
          </button>

        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="text-sm text-slate-400">
            Total Waste Logged
          </div>

          <div className="mt-2 text-5xl font-bold text-red-400">
            {totalWaste}
          </div>

        </div>

        <div className="space-y-4">

          {wasteLogs.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    {entry.itemName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {entry.reason}
                  </p>
                </div>

                <div className="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs font-semibold text-red-300">
                  Waste Logged
                </div>

              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                  <div className="text-sm text-slate-400">
                    Quantity Wasted
                  </div>

                  <div className="mt-2 text-4xl font-bold text-red-400">
                    {entry.quantityWasted}
                  </div>

                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                  <div className="text-sm text-slate-400">
                    Date Logged
                  </div>

                  <div className="mt-2 text-xl font-semibold">
                    {entry.date}
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