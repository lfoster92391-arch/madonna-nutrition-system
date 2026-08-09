"use client"

import Link from "next/link"

export default function InventoryPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Inventory</h1>
          <p className="mt-2 text-slate-400">
            Live stock is managed in Admin. This page no longer shows sample items.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 px-6 py-12 text-center">
          <p className="text-xl font-semibold">No groceries yet</p>
          <p className="mt-2 text-slate-400">Add your first purchase to start tracking stock.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/admin/finance?tab=groceries"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-500"
            >
              Add a grocery
            </Link>
            <Link
              href="/admin/inventory"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-slate-600 px-6 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open inventory
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
