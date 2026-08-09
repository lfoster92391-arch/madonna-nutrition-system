"use client"

import Link from "next/link"

export default function FinancialPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Financials</h1>
          <p className="mt-2 text-slate-400">
            Grocery purchases and spend live in the admin Financials area — not mock student balances.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 px-6 py-12 text-center">
          <p className="text-xl font-semibold">No groceries yet</p>
          <p className="mt-2 text-slate-400">
            Add your first purchase in Admin → Financials → Groceries.
          </p>
          <Link
            href="/admin/finance?tab=groceries"
            className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-green-600 px-6 text-sm font-semibold text-white hover:bg-green-500"
          >
            Open Financials
          </Link>
        </div>
      </div>
    </main>
  )
}
