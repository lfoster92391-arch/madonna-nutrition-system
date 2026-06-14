"use client"

export default function PredictiveInsightsPage() {
  const insights = [
    {
      id: 1,
      title: "Projected Inventory Shortage",
      prediction:
        "Chicken Patties expected to fall below operational threshold within 2 lunch periods.",
      severity: "warning",
    },

    {
      id: 2,
      title: "High Lunch Traffic Forecast",
      prediction:
        "Friday lunch participation expected to increase by 18% based on menu popularity trends.",
      severity: "info",
    },

    {
      id: 3,
      title: "Waste Trend Warning",
      prediction:
        "Green Beans continue exceeding recommended waste tolerance thresholds.",
      severity: "warning",
    },

    {
      id: 4,
      title: "Balance Alert Projection",
      prediction:
        "5 additional student accounts expected to enter low balance status within 48 hours.",
      severity: "critical",
    },
  ]

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
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-6xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Predictive Operational Insights
            </h1>

            <p className="mt-2 text-slate-400">
              Forecasting cafeteria operational risks and trends
            </p>
          </div>

          <div className="rounded-full border border-blue-700 bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
            AI Forecast Engine Active
          </div>

        </div>

        <div className="grid gap-6">

          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-2xl border p-6 ${getStyles(
                insight.severity
              )}`}
            >

              <div className="flex items-start justify-between gap-6">

                <div>
                  <h2 className="text-3xl font-bold">
                    {insight.title}
                  </h2>

                  <p className="mt-4 text-lg leading-8">
                    {insight.prediction}
                  </p>
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