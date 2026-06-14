"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export default function PerformancePage() {
  const mealData = [
    {
      meal: "Pizza Day",
      popularity: 94,
    },

    {
      meal: "Cheeseburger",
      popularity: 81,
    },

    {
      meal: "Walking Tacos",
      popularity: 73,
    },

    {
      meal: "Chicken Patty",
      popularity: 67,
    },
  ]

  const wasteData = [
    {
      name: "Vegetables",
      value: 38,
    },

    {
      name: "Milk",
      value: 24,
    },

    {
      name: "Fruit",
      value: 18,
    },

    {
      name: "Other",
      value: 20,
    },
  ]

  const COLORS = [
    "#ef4444",
    "#facc15",
    "#3b82f6",
    "#22c55e",
  ]

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Performance Analytics Center
            </h1>

            <p className="mt-2 text-slate-400">
              Executive cafeteria operational performance intelligence
            </p>
          </div>

          <div className="rounded-full border border-green-700 bg-green-950 px-4 py-2 text-sm font-semibold text-green-300">
            Operational Efficiency: 92%
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Meals Served This Week
            </div>

            <div className="mt-3 text-5xl font-bold text-blue-400">
              2,438
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Avg Service Speed
            </div>

            <div className="mt-3 text-5xl font-bold text-green-400">
              11s
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Highest Waste Category
            </div>

            <div className="mt-3 text-3xl font-bold text-red-400">
              Vegetables
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Peak Lunch Period
            </div>

            <div className="mt-3 text-3xl font-bold text-yellow-400">
              11:30 AM
            </div>

          </div>

        </div>

        <div className="grid gap-6 xl:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Meal Popularity Trends
              </h2>

              <p className="mt-1 text-slate-400">
                Student participation and meal demand
              </p>
            </div>

            <div className="h-[350px]">

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mealData}>
                  <XAxis dataKey="meal" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="popularity"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                Waste Distribution Analysis
              </h2>

              <p className="mt-1 text-slate-400">
                Operational waste category breakdown
              </p>
            </div>

            <div className="h-[350px]">

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>

                  <Pie
                    data={wasteData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                  >

                    {wasteData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}

                  </Pie>

                  <Tooltip />

                </PieChart>
              </ResponsiveContainer>

            </div>

          </div>

        </div>

      </div>

    </main>
  )
}