"use client"

import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Monitor,
  Package,
  Thermometer,
  Users,
} from "lucide-react"
import { useDemo } from "@/components/providers/DemoProvider"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default function OpsCenterPage() {
  const { inventory, transactions, students, notifications } = useDemo()

  const lowStock = inventory.filter((i) => i.qty <= i.lowStockThreshold)
  const todayRevenue = transactions.reduce((s, t) => s + t.amount, 0)
  const unreadAlerts = notifications.filter((n) => !n.read).length
  const lowBalanceStudents = students.filter((s) => s.balance >= 0 && s.balance < 10)

  const widgets = [
    {
      title: "Live Monitor",
      icon: Monitor,
      content: `${transactions.length} transactions today`,
      status: "success" as const,
    },
    {
      title: "Incident Center",
      icon: AlertTriangle,
      content: "0 open incidents",
      status: "success" as const,
    },
    {
      title: "Inventory Status",
      icon: Package,
      content: `${lowStock.length} low stock items`,
      status: lowStock.length > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      title: "Temperature Logs",
      icon: Thermometer,
      content: "All units in range",
      status: "success" as const,
    },
    {
      title: "Staff Tasks",
      icon: ClipboardList,
      content: "3 tasks pending",
      status: "warning" as const,
    },
    {
      title: "Financial Health",
      icon: DollarSign,
      content: `${formatCurrency(todayRevenue)} today`,
      status: "success" as const,
    },
    {
      title: "Alerts",
      icon: AlertTriangle,
      content: `${unreadAlerts} unread notifications`,
      status: unreadAlerts > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      title: "Operational Queue",
      icon: Users,
      content: `${lowBalanceStudents.length} low balance accounts`,
      status: lowBalanceStudents.length > 0 ? ("warning" as const) : ("success" as const),
    },
  ]

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Operations Command Center</h1>
          <p className="text-silver-foreground">Real-time operational visibility across all systems</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map(({ title, icon: Icon, content, status }) => (
            <Card key={title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <Badge variant={status}>{status === "success" ? "OK" : "Attention"}</Badge>
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{content}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Live Transaction Feed</CardTitle></CardHeader>
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex justify-between rounded-2xl bg-silver/20 px-4 py-3 text-sm">
                  <span className="font-medium text-primary">{tx.studentName}</span>
                  <span>{tx.meal} · {formatCurrency(tx.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notification Center</CardTitle></CardHeader>
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-2xl border border-silver/40 px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <Badge variant={n.type === "negative_balance" ? "danger" : "warning"}>
                      {n.type.replace(/_/g, " ")}
                    </Badge>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-2 text-silver-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Temperature Log Summary</CardTitle></CardHeader>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { unit: "Walk-in Cooler", temp: "38°F", status: "success" },
              { unit: "Freezer #1", temp: "-2°F", status: "success" },
              { unit: "Hot Holding", temp: "148°F", status: "success" },
            ].map((log) => (
              <div key={log.unit} className="rounded-2xl bg-silver/20 p-4">
                <p className="font-medium text-primary">{log.unit}</p>
                <p className="text-2xl font-bold text-primary">{log.temp}</p>
                <Badge variant={log.status as "success"} className="mt-2">In Range</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
