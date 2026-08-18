"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/components/providers/AuthProvider"
import { api } from "@/lib/api/client"
import type { InventoryMovement, OpsInventoryItem } from "@/lib/operations/types"

const REASONS = [
  { value: "leftover", label: "Leftover" },
  { value: "tray waste", label: "Tray waste" },
  { value: "overproduction", label: "Overproduction" },
  { value: "spoiled", label: "Spoiled" },
  { value: "other", label: "Other" },
] as const

function todayKey() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${month}-${day}`
}

function reasonLabel(value: string) {
  return REASONS.find((r) => r.value === value)?.label ?? value
}

export default function WastePage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [itemId, setItemId] = useState("")
  const [qty, setQty] = useState("1")
  const [reason, setReason] = useState<(typeof REASONS)[number]["value"]>("leftover")
  const [date, setDate] = useState(todayKey)
  const [whoLogged, setWhoLogged] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.displayName) setWhoLogged((current) => current || user.displayName)
  }, [user?.displayName])

  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.getInventory(),
  })

  const items = data?.items ?? []
  const selected = items.find((item) => item.id === itemId)

  const wasteLogs = useMemo(() => {
    const movements = data?.movements ?? []
    const byId = new Map(items.map((item) => [item.id, item]))
    return movements
      .filter((m) => m.type === "waste")
      .map((m) => ({ movement: m, item: byId.get(m.inventoryItemId) }))
  }, [data?.movements, items])

  const totalWaste = wasteLogs.reduce((sum, row) => sum + Math.abs(row.movement.quantity), 0)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!itemId) throw new Error("Choose an item from inventory.")
      const quantity = Number(qty)
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Enter how much was wasted.")
      const who = whoLogged.trim() || user?.displayName || "Cafeteria"
      const note = `${reasonLabel(reason)}. Logged by ${who}${date !== todayKey() ? ` for ${date}` : ""}.`
      return api.recordInventoryMovement({
        inventoryItemId: itemId,
        type: "waste",
        quantity,
        note,
        createdBy: who,
        loggedAt: `${date}T12:00:00`,
      })
    },
    onSuccess: (result) => {
      const name = result.item.name
      const remaining = result.item.qty
      const unit = result.item.unit
      setSuccess(
        `Logged. ${name} is now ${remaining} ${unit} on the shelf — that wasted amount came off stock.`
      )
      setError(null)
      setQty("1")
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
    onError: (err) => {
      setSuccess(null)
      setError(err instanceof Error ? err.message : "Could not log waste. Try again.")
    },
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(null)
    setError(null)
    mutation.mutate()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Waste log</h1>
          <p className="mt-2 text-slate-400">
            Record leftover food, tray waste, or spoiled items. Submitting takes that amount off live inventory.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              Item
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
              >
                <option value="">Choose from inventory…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.qty} {item.unit} on hand)
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Quantity wasted
              <input
                type="number"
                min={1}
                step={1}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </label>
            <label className="text-sm text-slate-300">
              Unit
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-300"
                value={selected?.unit ?? "Select an item"}
                readOnly
              />
            </label>
            <label className="text-sm text-slate-300">
              Reason
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                value={reason}
                onChange={(e) => setReason(e.target.value as (typeof REASONS)[number]["value"])}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Date
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="text-sm text-slate-300">
              Who logged this
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                value={whoLogged}
                onChange={(e) => setWhoLogged(e.target.value)}
                placeholder="Your name"
                required
              />
            </label>
          </div>

          {!user && (
            <p className="text-sm text-yellow-200">
              Sign in as cafeteria staff so waste can come off live inventory.
            </p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending || !user}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {mutation.isPending ? "Saving…" : "Log waste"}
          </button>

          {success && (
            <p className="rounded-xl border border-green-700 bg-green-950 px-4 py-3 text-green-200">
              {success}
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-red-700 bg-red-950 px-4 py-3 text-red-200">{error}</p>
          )}
          {!isLoading && items.length === 0 && (
            <p className="text-slate-400">
              No inventory items yet. Add groceries in Admin first, then you can log waste here.
            </p>
          )}
        </form>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-sm text-slate-400">Waste logged recently (from live inventory)</div>
          <div className="mt-2 text-5xl font-bold text-red-400">{isLoading ? "…" : totalWaste}</div>
        </div>

        <div className="space-y-4">
          {wasteLogs.map(({ movement, item }) => (
            <WasteLogCard key={movement.id} movement={movement} item={item} />
          ))}
          {!isLoading && wasteLogs.length === 0 && (
            <p className="text-slate-400">No waste logged yet. Use the form above when something is thrown out.</p>
          )}
        </div>
      </div>
    </main>
  )
}

function WasteLogCard({
  movement,
  item,
}: {
  movement: InventoryMovement
  item?: OpsInventoryItem
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{item?.name ?? "Inventory item"}</h2>
          <p className="mt-1 text-sm text-slate-400">{movement.note ?? "Waste"}</p>
        </div>
        <div className="rounded-full border border-red-700 bg-red-950 px-3 py-1 text-xs font-semibold text-red-300">
          Waste logged
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm text-slate-400">Quantity wasted</div>
          <div className="mt-2 text-4xl font-bold text-red-400">
            {Math.abs(movement.quantity)}
            {item?.unit ? <span className="ml-2 text-lg text-slate-400">{item.unit}</span> : null}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm text-slate-400">Date logged</div>
          <div className="mt-2 text-xl font-semibold">
            {new Date(movement.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="text-sm text-slate-400">Logged by</div>
          <div className="mt-2 text-xl font-semibold">{movement.createdBy ?? "—"}</div>
        </div>
      </div>
    </div>
  )
}
