"use client"

import { Users } from "lucide-react"

export default function StaffingPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Staffing & Scheduling Center</h1>
          <p className="mt-2 text-slate-400">
            Cafeteria workforce scheduling and operational coverage
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900 px-8 py-24 text-center">
          <Users className="mb-4 h-12 w-12 text-slate-500" />
          <h2 className="text-2xl font-bold">No staff schedules yet</h2>
          <p className="mt-2 max-w-md text-slate-400">
            Staff assignments will appear here once schedules are configured in the system.
          </p>
        </div>
      </div>
    </main>
  )
}
