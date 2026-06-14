"use client"

import { ChefHat } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { DEMO_PRODUCTION_ORDERS } from "@/data/demo/operations"

const STATUS_VARIANT: Record<string, "default" | "warning" | "success"> = {
  planned: "default",
  in_progress: "warning",
  completed: "success",
  cancelled: "default",
}

export default function AdminProductionPage() {
  const active = DEMO_PRODUCTION_ORDERS.filter((o) => o.status === "in_progress").length

  return (
    <AdminModulePage
      section="Operations"
      title="Production"
      description="Daily production orders linked to calendar meals and portion counts."
      icon={ChefHat}
      stats={[
        { label: "Active Orders", value: String(active), variant: active ? "warning" : "success" },
        { label: "Scheduled Today", value: String(DEMO_PRODUCTION_ORDERS.length) },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Production Queue</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {DEMO_PRODUCTION_ORDERS.map((order) => {
            const pct =
              order.portionsPlanned > 0
                ? Math.round((order.portionsMade / order.portionsPlanned) * 100)
                : 0
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-silver/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{order.title}</p>
                    <p className="text-sm text-silver-foreground">
                      {new Date(order.scheduledFor).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3">
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
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </AdminModulePage>
  )
}
