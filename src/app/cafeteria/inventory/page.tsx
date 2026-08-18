"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const { data, isLoading, isError } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(),
  })

  const items = data?.items ?? []
  const locations = data?.storageLocations ?? []
  const locMap = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l.name])),
    [locations]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.barcode ?? "").includes(q)
    )
  }, [items, search])

  const now = Date.now()
  const week = 7 * 86400000
  const lowStock = items.filter((i) => i.qty <= i.lowStockThreshold)

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
            <p className="mt-2 text-slate-400">
              Live stock — the same counts Admin sees. Logging waste takes items off this list.
            </p>
          </div>
          <Link
            href="/cafeteria/waste"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            Log waste
          </Link>
        </div>

        {lowStock.length > 0 && (
          <div className="rounded-2xl border border-yellow-800 bg-yellow-950/40 px-5 py-4 text-yellow-200">
            {lowStock.length} item{lowStock.length === 1 ? "" : "s"} running low:{" "}
            {lowStock.map((i) => `${i.name} (${i.qty} ${i.unit})`).join(", ")}
          </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          {items.length > 0 && (
            <input
              className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 px-3 py-3"
              placeholder="Search items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}

          {isLoading && <p className="text-slate-400">Loading live stock…</p>}
          {isError && <p className="text-red-300">Could not load inventory. Try again in a moment.</p>}

          {!isLoading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-12 text-center">
              <p className="text-xl font-semibold">No groceries yet</p>
              <p className="mt-2 text-slate-400">Add a purchase in Admin Financials to start tracking stock.</p>
              <Link
                href="/admin/finance?tab=groceries"
                className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-green-600 px-6 text-sm font-semibold hover:bg-green-500"
              >
                Add a grocery
              </Link>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-400">
                    <th className="pb-3 pr-4 font-medium">Item</th>
                    <th className="pb-3 pr-4 font-medium">Location</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 text-right font-medium">On hand</th>
                    <th className="pb-3 pr-4 text-right font-medium">Par</th>
                    <th className="pb-3 text-right font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isLow = item.qty <= item.lowStockThreshold
                    const exp = new Date(item.expiration).getTime()
                    const isExp = exp - now < week
                    return (
                      <tr key={item.id} className="border-b border-slate-800/80">
                        <td className="py-3 pr-4 font-semibold">
                          {item.name}
                          {isLow ? (
                            <span className="ml-2 text-xs font-medium text-yellow-300">Low</span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {item.storageLocationId ? locMap[item.storageLocationId] ?? "—" : "—"}
                        </td>
                        <td className="py-3 pr-4 capitalize text-slate-300">{item.category}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {item.qty} {item.unit}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{item.lowStockThreshold}</td>
                        <td className={`py-3 text-right tabular-nums ${isExp ? "text-yellow-300" : ""}`}>
                          {item.expiration}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
