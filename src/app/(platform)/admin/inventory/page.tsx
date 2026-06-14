"use client"

import { useMemo } from "react"
import { AlertTriangle, Package } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useDemo } from "@/components/providers/DemoProvider"
import { formatCurrency } from "@/lib/utils"

export default function AdminInventoryPage() {
  const { inventory } = useDemo()

  const lowStock = useMemo(
    () => inventory.filter((i) => i.qty <= i.lowStockThreshold),
    [inventory]
  )

  const totalValue = inventory.reduce((sum, i) => sum + i.qty * i.cost, 0)

  return (
    <AdminModulePage
      section="Operations"
      title="Inventory"
      description="Par levels, stock counts, and expiration tracking for kitchen operations."
      icon={Package}
      stats={[
        { label: "SKUs", value: String(inventory.length) },
        {
          label: "Low Stock",
          value: String(lowStock.length),
          variant: lowStock.length ? "warning" : "success",
        },
        { label: "Total Value", value: formatCurrency(totalValue) },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-silver/60 text-silver-foreground">
                <th className="pb-3 pr-4 text-left font-medium">Item</th>
                <th className="pb-3 pr-4 text-left font-medium">Category</th>
                <th className="pb-3 pr-4 text-right font-medium">Qty</th>
                <th className="pb-3 pr-4 text-right font-medium">Par</th>
                <th className="pb-3 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const isLow = item.qty <= item.lowStockThreshold
                return (
                  <tr key={item.id} className="border-b border-silver/30">
                    <td className="py-3 pr-4 font-medium text-primary">
                      <span className="flex items-center gap-2">
                        {item.name}
                        {isLow && <AlertTriangle className="h-4 w-4 text-warning" />}
                      </span>
                    </td>
                    <td className="py-3 pr-4 capitalize">{item.category}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{item.lowStockThreshold}</td>
                    <td className="py-3 text-right tabular-nums">
                      {formatCurrency(item.qty * item.cost)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {lowStock.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <Badge key={item.id} variant="warning">
                {item.name}: {item.qty} left
              </Badge>
            ))}
          </div>
        )}
      </Card>
    </AdminModulePage>
  )
}
