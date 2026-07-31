"use client"

export default function IncidentsPage() {
  const incidents: Array<{
    id: number
    title: string
    severity: string
    status: string
    description: string
    timestamp: string
  }> = []

  function getSeverityStyles(severity: string) {
    switch (severity) {
      case "Critical":
        return "border-red-700 bg-red-950 text-red-300"

      case "High":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"

      case "Medium":
        return "border-blue-700 bg-blue-950 text-blue-300"

      default:
        return "border-slate-700 bg-slate-900 text-slate-300"
    }
  }

  function getStatusStyles(status: string) {
    switch (status) {
      case "Active":
        return "border-red-700 bg-red-950 text-red-300"

      case "Monitoring":
        return "border-yellow-700 bg-yellow-950 text-yellow-300"

      default:
        return "border-green-700 bg-green-950 text-green-300"
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mx-auto max-w-7xl space-y-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Emergency Operations & Incident Center
            </h1>

            <p className="mt-2 text-slate-400">
              Cafeteria operational incident management and emergency oversight
            </p>
          </div>

          <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300">
            {incidents.length} Incidents
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Total Incidents
            </div>

            <div className="mt-3 text-5xl font-bold text-blue-400">
              {incidents.length}
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Active Incidents
            </div>

            <div className="mt-3 text-5xl font-bold text-red-400">
              1
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Resolved Incidents
            </div>

            <div className="mt-3 text-5xl font-bold text-green-400">
              2
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Operational Stability
            </div>

            <div className="mt-3 text-3xl font-bold text-yellow-300">
              Stable
            </div>

          </div>

        </div>

        <div className="space-y-4">

          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-start justify-between gap-6">

                <div className="space-y-4 flex-1">

                  <div>

                    <div className="flex flex-wrap gap-3">

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getSeverityStyles(
                          incident.severity
                        )}`}
                      >
                        {incident.severity}
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusStyles(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </div>

                    </div>

                    <h2 className="mt-4 text-3xl font-bold">
                      {incident.title}
                    </h2>

                  </div>

                  <p className="text-lg leading-8 text-slate-300">
                    {incident.description}
                  </p>

                  <div className="text-sm text-slate-500">
                    Logged: {incident.timestamp}
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