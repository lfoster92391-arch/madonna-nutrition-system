"use client"

import { useMemo } from "react"
import { AlertTriangle, Barcode, Package } from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function InventoryPage() {
  const { inventory } = useDemo()

  const lowStock = useMemo(
    () => inventory.filter((i) => i.qty <= i.lowStockThreshold),
    [inventory]
  )

  const expiringSoon = useMemo(() => {
    const now = new Date("2026-06-13").getTime()
    const week = 7 * 86400000
    return inventory.filter((i) => {
      const exp = new Date(i.expiration).getTime()
      return exp - now < week && exp > now
    })
  }, [inventory])

  const totalValue = inventory.reduce((sum, i) => sum + i.qty * i.cost, 0)

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Inventory</h1>
            <p className="text-silver-foreground">Stock management, alerts, and nutrition tracking</p>
          </div>
          <Button variant="outline">
            <Barcode className="h-4 w-4" />
            Barcode Scan
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardDescription>Total Items</CardDescription>
            <p className="text-3xl font-bold text-primary">{inventory.length}</p>
          </Card>
          <Card>
            <CardDescription>Inventory Value</CardDescription>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalValue)}</p>
          </Card>
          <Card>
            <CardDescription>Low Stock Alerts</CardDescription>
            <p className="text-3xl font-bold text-warning">{lowStock.length}</p>
          </Card>
          <Card>
            <CardDescription>Expiring This Week</CardDescription>
            <p className="text-3xl font-bold text-danger">{expiringSoon.length}</p>
          </Card>
        </div>

        {lowStock.length > 0 && (
          <Card className="border-warning/40 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((i) => (
                <Badge key={i.id} variant="warning">
                  {i.name}: {i.qty} {i.unit} (min {i.lowStockThreshold})
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Items
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/60 text-silver-foreground">
                  <th className="pb-3 pr-4 text-left font-medium">Name</th>
                  <th className="pb-3 pr-4 text-left font-medium">Qty</th>
                  <th className="pb-3 pr-4 text-left font-medium">Unit</th>
                  <th className="pb-3 pr-4 text-right font-medium">Cost</th>
                  <th className="pb-3 pr-4 text-left font-medium">Expiration</th>
                  <th className="pb-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isLow = item.qty <= item.lowStockThreshold
                  const isExpiring = expiringSoon.some((e) => e.id === item.id)
                  return (
                    <tr key={item.id} className="border-b border-silver/30">
                      <td className="py-3 pr-4 font-medium text-primary">{item.name}</td>
                      <td className="py-3 pr-4 tabular-nums">{item.qty}</td>
                      <td className="py-3 pr-4">{item.unit}</td>
                      <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(item.cost)}</td>
                      <td className="py-3 pr-4">{item.expiration}</td>
                      <td className="py-3">
                        {isLow && <Badge variant="warning">Low Stock</Badge>}
                        {isExpiring && <Badge variant="danger" className="ml-1">Expiring</Badge>}
                        {!isLow && !isExpiring && <Badge variant="success">OK</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Forecast</CardTitle>
              <CardDescription>Items expiring within 7 days</CardDescription>
            </CardHeader>
            {expiringSoon.length === 0 ? (
              <p className="text-silver-foreground">No items expiring this week.</p>
            ) : (
              <ul className="space-y-2">
                {expiringSoon.map((i) => (
                  <li key={i.id} className="flex justify-between rounded-2xl bg-silver/20 px-4 py-3">
                    <span className="font-medium text-primary">{i.name}</span>
                    <span className="text-danger">{i.expiration}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Waste Tracking</CardTitle>
              <CardDescription>Integration with waste module</CardDescription>
            </CardHeader>
            <p className="text-silver-foreground">
              Track spoilage and overproduction. Connect inventory items to daily waste logs for nutrition breakdown analysis.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
