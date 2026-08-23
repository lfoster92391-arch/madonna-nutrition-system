"use client"

import Link from "next/link"
import { useKitchenBoard } from "@/components/admin/kitchen/useKitchenBoard"

/**
 * Sunday (and weekend) prep view: reserved lunch head counts for the upcoming Mon–Fri.
 * Also works Mon–Fri for the current school week.
 */
export default function SundayHeadCountPage() {
  const { data, error, loading } = useKitchenBoard()

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white p-8">
        <p className="text-lg text-[#64748B]">Loading week head counts…</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white p-8">
        <p className="text-lg text-[#D62828]">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const { weekAhead, weekAheadLabel } = data
  const totalReserved = weekAhead.reduce((sum, d) => sum + d.orderedCount, 0)
  const totalSlices = weekAhead.reduce((sum, d) => sum + d.pizzaSlices, 0)

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#041B52]/60">
              Fuel The Dons · Kitchen
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[#041B52] sm:text-4xl">
              Sunday head count
            </h1>
            <p className="mt-2 text-[#64748B]">
              Reserved lunches for {weekAheadLabel}. Open this on Sunday to plan the week ahead.
            </p>
          </div>
          <Link
            href="/admin/kitchen"
            className="rounded-xl border border-[#AEB6C2] bg-white px-4 py-2 text-sm font-semibold text-[#041B52]"
          >
            Back to kitchen board
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#AEB6C2]/50 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#64748B]">
              Total reserved
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-[#041B52]">{totalReserved}</p>
          </div>
          <div className="rounded-2xl border border-[#AEB6C2]/50 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#64748B]">
              Pizza slices
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-[#041B52]">{totalSlices}</p>
          </div>
          <div className="rounded-2xl border border-[#AEB6C2]/50 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#64748B]">
              School days
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums text-[#041B52]">{weekAhead.length}</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#AEB6C2]/50 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#041B52] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Day</th>
                <th className="px-4 py-3 font-semibold">Menu</th>
                <th className="px-4 py-3 font-semibold tabular-nums">Reserved</th>
                <th className="px-4 py-3 font-semibold">Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {weekAhead.map((day) => (
                <tr key={day.date} className="border-t border-[#AEB6C2]/40">
                  <td className="px-4 py-4 font-semibold text-[#041B52]">{day.weekdayLabel}</td>
                  <td className="px-4 py-4 text-[#64748B]">{day.menuTitle ?? "—"}</td>
                  <td className="px-4 py-4 text-2xl font-bold tabular-nums text-[#041B52]">
                    {day.orderedCount}
                    {day.pizzaSlices > 0 ? (
                      <span className="ml-2 text-sm font-medium text-[#64748B]">
                        ({day.pizzaSlices} slices)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-[#64748B]">
                    {day.meals.length === 0
                      ? "No orders yet"
                      : day.meals.map((m) => `${m.count}× ${m.name}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
