"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChefHat, UtensilsCrossed } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ProductionOrder } from "@/lib/operations/types"

interface ProductionData {
  source: string
  orders: ProductionOrder[]
  todayOrders: ProductionOrder[]
}

async function fetchProduction(): Promise<ProductionData> {
  const res = await fetch("/api/production")
  if (!res.ok) throw new Error("Failed to load production")
  return res.json()
}

async function fetchInventoryItems() {
  const res = await fetch("/api/inventory")
  if (!res.ok) return { items: [] }
  return res.json()
}

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  planned: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
}

const FLOW_STEPS = ["Reservations", "Meals", "Ingredient Pull", "Kitchen Prep"] as const

export function ProductionCenter() {
  const queryClient = useQueryClient()
  const [wasteOrderId, setWasteOrderId] = useState<string | null>(null)
  const [wasteItemId, setWasteItemId] = useState("")
  const [wasteQty, setWasteQty] = useState("1")
  const [wasteNote, setWasteNote] = useState("")

  const { data, isLoading } = useQuery({ queryKey: ["production"], queryFn: fetchProduction })
  const { data: invData } = useQuery({ queryKey: ["inventory"], queryFn: fetchInventoryItems })

  const patchMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/production", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update production order")
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["production"] })
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
      setWasteOrderId(null)
      setWasteNote("")
      setWasteQty("1")
    },
  })

  const orders = data?.todayOrders ?? data?.orders ?? []
  const active = orders.filter((o) => o.status === "in_progress").length

  const stepIndex = (status: ProductionOrder["status"]) => {
    if (status === "planned") return 0
    if (status === "in_progress") return 2
    if (status === "completed") return 3
    return 0
  }

  const advanceStatus = (order: ProductionOrder) => {
    const next =
      order.status === "planned"
        ? "in_progress"
        : order.status === "in_progress"
          ? "completed"
          : order.status
    patchMutation.mutate({
      id: order.id,
      status: next,
      portionsMade: next === "completed" ? order.portionsPlanned : order.portionsMade,
    })
  }

  const submitWaste = () => {
    if (!wasteOrderId || !wasteItemId) return
    patchMutation.mutate({
      id: wasteOrderId,
      wasteItemId,
      wasteQuantity: Number(wasteQty) || 1,
      wasteNote: wasteNote || "Production waste",
    })
  }

  return (
    <AdminModulePage
      section="Operations"
      title="Production Center"
      description="Today's production from calendar reservations and meal templates."
      icon={ChefHat}
      stats={[
        { label: "Active Orders", value: String(active), variant: active ? "warning" : "success" },
        { label: "Scheduled Today", value: String(orders.length) },
        { label: "Source", value: data?.source === "demo" ? "Demo" : "Live", hint: "Calendar + templates" },
      ]}
    >
      {isLoading && <p className="text-silver-foreground">Loading production queue…</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        {FLOW_STEPS.map((step, i) => (
          <Badge key={step} variant={i <= 1 ? "default" : "outline"}>
            {i + 1}. {step}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {orders.map((order) => {
            const pct =
              order.portionsPlanned > 0
                ? Math.round((order.portionsMade / order.portionsPlanned) * 100)
                : 0
            const currentStep = stepIndex(order.status)
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        {order.title}
                      </CardTitle>
                      <p className="mt-1 text-sm text-silver-foreground">
                        {new Date(order.scheduledFor).toLocaleString()}
                      </p>
                      {order.notes && (
                        <p className="mt-1 text-sm text-silver-foreground">{order.notes}</p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <div className="px-6 pb-6">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {FLOW_STEPS.map((step, i) => (
                      <span
                        key={step}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          i <= currentStep ? "bg-success/15 text-success" : "bg-silver/20 text-silver-foreground"
                        }`}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {order.portionsMade} / {order.portionsPlanned} portions
                    </span>
                    <span className="font-medium">{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-silver/30">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.status !== "completed" && order.status !== "cancelled" && (
                      <Button size="sm" onClick={() => advanceStatus(order)}>
                        {order.status === "planned" ? "Start Prep" : "Mark Complete"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setWasteOrderId(order.id)}>
                      Log Waste
                    </Button>
                    {order.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          patchMutation.mutate({
                            id: order.id,
                            portionsMade: Math.min(order.portionsPlanned, order.portionsMade + 10),
                          })
                        }
                      >
                        +10 Portions
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
          {orders.length === 0 && (
            <Card>
              <p className="p-8 text-center text-silver-foreground">No production orders scheduled for today.</p>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Waste Logging</CardTitle>
          </CardHeader>
          <div className="space-y-3 px-6 pb-6">
            <label className="text-sm">
              Production order
              <select
                className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                value={wasteOrderId ?? ""}
                onChange={(e) => setWasteOrderId(e.target.value || null)}
              >
                <option value="">Select order…</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Ingredient
              <select
                className="mt-1 w-full rounded-xl border border-silver/60 px-3 py-2"
                value={wasteItemId}
                onChange={(e) => setWasteItemId(e.target.value)}
              >
                <option value="">Select item…</option>
                {(invData?.items ?? []).map((i: { id: string; name: string; qty: number; unit: string }) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.qty} {i.unit})
                  </option>
                ))}
              </select>
            </label>
            <Input type="number" min={1} value={wasteQty} onChange={(e) => setWasteQty(e.target.value)} />
            <Textarea placeholder="Waste reason" value={wasteNote} onChange={(e) => setWasteNote(e.target.value)} />
            <Button className="w-full" disabled={!wasteOrderId || !wasteItemId} onClick={submitWaste}>
              Submit Waste Log
            </Button>
          </div>
        </Card>
      </div>
    </AdminModulePage>
  )
}
