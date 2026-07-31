"use client"

export default function PredictiveInsightsPage() {
  const insights: Array<{
    id: number
    title: string
    prediction: string
    severity: string
  }> = []

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
            No forecasts yet
          </div>

        </div>

        <div className="grid gap-6">

          {insights.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-slate-400">
              No predictive insights yet — data appears after real cafeteria activity is recorded.
            </div>
          ) : null}

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