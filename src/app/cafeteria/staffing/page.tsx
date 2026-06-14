"use client"

export default function StaffingPage() {
  const staffSchedule = [
    {
      id: 1,
      name: "Maria Thompson",
      role: "Cashier",
      shift: "7:00 AM - 1:30 PM",
      station: "Front Register",
      status: "Active",
    },

    {
      id: 2,
      name: "James Carter",
      role: "Kitchen Prep",
      shift: "6:00 AM - 2:00 PM",
      station: "Preparation Area",
      status: "Active",
    },

    {
      id: 3,
      name: "Angela Rivera",
      role: "Inventory Coordinator",
      shift: "8:00 AM - 3:00 PM",
      station: "Storage & Inventory",
      status: "Break",
    },

    {
      id: 4,
      name: "David Brooks",
      role: "Line Supervisor",
      shift: "10:00 AM - 2:30 PM",
      station: "Serving Line",
      status: "Active",
    },
  ]

  function getStatusStyles(status: string) {
    switch (status) {
      case "Break":
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
              Staffing & Scheduling Center
            </h1>

            <p className="mt-2 text-slate-400">
              Cafeteria workforce scheduling and operational coverage
            </p>
          </div>

          <div className="rounded-full border border-blue-700 bg-blue-950 px-4 py-2 text-sm font-semibold text-blue-300">
            {staffSchedule.length} Staff Scheduled
          </div>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Active Staff
            </div>

            <div className="mt-3 text-5xl font-bold text-green-400">
              3
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Staff on Break
            </div>

            <div className="mt-3 text-5xl font-bold text-yellow-400">
              1
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Lunch Coverage Status
            </div>

            <div className="mt-3 text-3xl font-bold text-blue-400">
              Optimal
            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="text-sm text-slate-400">
              Avg Shift Coverage
            </div>

            <div className="mt-3 text-3xl font-bold text-green-300">
              98%
            </div>

          </div>

        </div>

        <div className="space-y-4">

          {staffSchedule.map((staff) => (
            <div
              key={staff.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
            >

              <div className="flex items-start justify-between gap-6">

                <div className="space-y-3">

                  <div>
                    <h2 className="text-2xl font-bold">
                      {staff.name}
                    </h2>

                    <p className="mt-1 text-slate-400">
                      {staff.role}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">

                    <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">

                      <div className="text-sm text-slate-400">
                        Shift Schedule
                      </div>

                      <div className="mt-1 font-semibold">
                        {staff.shift}
                      </div>

                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">

                      <div className="text-sm text-slate-400">
                        Assigned Station
                      </div>

                      <div className="mt-1 font-semibold">
                        {staff.station}
                      </div>

                    </div>

                  </div>

                </div>

                <div
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyles(
                    staff.status
                  )}`}
                >
                  {staff.status}
                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </main>
  )
}