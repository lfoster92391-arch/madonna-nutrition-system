"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Clock, Package, Trash2 } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { ImportExportMenu } from "@/components/admin/import-export/ImportExportMenu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InventoryMovement, OpsInventoryItem, StorageLocation } from "@/lib/operations/types"
import { formatCurrency } from "@/lib/utils"

interface InventoryData {
  source: string
  items: OpsInventoryItem[]
  movements: InventoryMovement[]
  storageLocations: StorageLocation[]
}

async function fetchInventory(): Promise<InventoryData> {
  const res = await fetch("/api/inventory")
  if (!res.ok) throw new Error("Failed to load inventory")
  return res.json()
}

export function InventoryManager() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [usageQty, setUsageQty] = useState("1")
  const [usageNote, setUsageNote] = useState("")

  const { data, isLoading } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventory })

  const movementMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "movement", ...payload }),
      })
      if (!res.ok) throw new Error("Failed to record movement")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setUsageQty("1")
      setUsageNote("")
    },
  })

  const items = data?.items ?? []
  const locations = data?.storageLocations ?? []
  const movements = data?.movements ?? []

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
        i.barcode?.includes(q)
    )
  }, [items, search])

  const now = new Date("2026-06-14").getTime()
  const week = 7 * 86400000

  const lowStock = items.filter((i) => i.qty <= i.lowStockThreshold)
  const expiringSoon = items.filter((i) => {
    const exp = new Date(i.expiration).getTime()
    return exp - now < week && exp >= now
  })
  const expired = items.filter((i) => new Date(i.expiration).getTime() < now)

  const selected = items.find((i) => i.id === selectedId)
  const itemMovements = movements.filter((m) => m.inventoryItemId === selectedId)

  const totalValue = items.reduce((sum, i) => sum + i.qty * i.cost, 0)

  const recordUsage = (type: "production" | "waste") => {
    if (!selectedId) return
    movementMutation.mutate({
      inventoryItemId: selectedId,
      type,
      quantity: Number(usageQty) || 1,
      note: usageNote || (type === "waste" ? "Waste logged" : "Kitchen usage"),
      createdBy: "Inventory",
    })
  }

  return (
    <AdminModulePage
      section="Operations"
      title="Inventory"
      description="Stock levels, expiration alerts, storage locations, and movement history."
      icon={Package}
      headerActions={<ImportExportMenu type="inventory" importDisabled />}
      stats={[
        { label: "SKUs", value: String(items.length) },
        { label: "Low Stock", value: String(lowStock.length), variant: lowStock.length ? "warning" : "success" },
        { label: "Expiring Soon", value: String(expiringSoon.length), variant: expiringSoon.length ? "warning" : "success" },
        { label: "Total Value", value: formatCurrency(totalValue) },
      ]}
    >
      {isLoading && <p className="text-silver-foreground">Loading inventory…</p>}

      {(lowStock.length > 0 || expiringSoon.length > 0 || expired.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {lowStock.map((i) => (
            <Badge key={`low-${i.id}`} variant="warning">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Low: {i.name} ({i.qty})
            </Badge>
          ))}
          {expiringSoon.map((i) => (
            <Badge key={`exp-${i.id}`} variant="warning">
              <Clock className="mr-1 h-3 w-3" />
              Expires {i.expiration}: {i.name}
            </Badge>
          ))}
          {expired.map((i) => (
            <Badge key={`x-${i.id}`} variant="danger">
              Expired: {i.name}
            </Badge>
          ))}
        </div>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Table</TabsTrigger>
          <TabsTrigger value="movements">Movement Timeline</TabsTrigger>
          <TabsTrigger value="actions">Usage / Waste</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle>Stock Levels</CardTitle>
              <Input
                className="max-w-xs"
                placeholder="Search items…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-silver/60 text-silver-foreground">
                    <th className="pb-3 pr-4 text-left font-medium">Item</th>
                    <th className="pb-3 pr-4 text-left font-medium">Location</th>
                    <th className="pb-3 pr-4 text-left font-medium">Category</th>
                    <th className="pb-3 pr-4 text-right font-medium">Qty</th>
                    <th className="pb-3 pr-4 text-right font-medium">Par</th>
                    <th className="pb-3 pr-4 text-right font-medium">Expires</th>
                    <th className="pb-3 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const isLow = item.qty <= item.lowStockThreshold
                    const isExp = new Date(item.expiration).getTime() - now < week
                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer border-b border-silver/30 hover:bg-silver/10"
                        onClick={() => setSelectedId(item.id)}
                      >
                        <td className="py-3 pr-4 font-medium text-primary">
                          <span className="flex items-center gap-2">
                            {item.name}
                            {isLow && <AlertTriangle className="h-4 w-4 text-warning" />}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-silver-foreground">
                          {item.storageLocationId ? locMap[item.storageLocationId] ?? "—" : "—"}
                        </td>
                        <td className="py-3 pr-4 capitalize">{item.category}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {item.qty} {item.unit}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{item.lowStockThreshold}</td>
                        <td className={`py-3 pr-4 text-right tabular-nums ${isExp ? "text-warning" : ""}`}>
                          {item.expiration}
                        </td>
                        <td className="py-3 text-right tabular-nums">
                          {formatCurrency(item.qty * item.cost)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>
                {selected ? `Movements — ${selected.name}` : "Select an item from Stock Table"}
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {itemMovements.map((m) => (
                <div key={m.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-silver/40 p-3">
                  <div>
                    <Badge variant={m.type === "waste" ? "danger" : m.type === "receive" ? "success" : "default"}>
                      {m.type}
                    </Badge>
                    <p className="mt-1 text-sm">{m.note ?? "—"}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold tabular-nums">
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </p>
                    <p className="text-silver-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {selectedId && itemMovements.length === 0 && (
                <p className="text-center text-silver-foreground">No movements recorded yet.</p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Record Usage or Waste</CardTitle>
            </CardHeader>
            <div className="grid max-w-md gap-4">
              <label className="text-sm">
                Item
                <select
                  className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                  value={selectedId ?? ""}
                  onChange={(e) => setSelectedId(e.target.value || null)}
                >
                  <option value="">Select item…</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.qty} {i.unit})
                    </option>
                  ))}
                </select>
              </label>
              <Input
                type="number"
                min={1}
                placeholder="Quantity"
                value={usageQty}
                onChange={(e) => setUsageQty(e.target.value)}
              />
              <Input
                placeholder="Note (optional)"
                value={usageNote}
                onChange={(e) => setUsageNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button disabled={!selectedId || movementMutation.isPending} onClick={() => recordUsage("production")}>
                  Record Usage
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedId || movementMutation.isPending}
                  onClick={() => recordUsage("waste")}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Log Waste
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminModulePage>
  )
}
