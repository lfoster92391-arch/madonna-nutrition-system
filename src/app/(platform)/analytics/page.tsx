"use client"

import { useMemo } from "react"
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js"
import { Bar, Doughnut, Line } from "react-chartjs-2"
import { useDemo } from "@/components/providers/DemoProvider"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

export default function AnalyticsPage() {
  const { transactions, students, inventory } = useDemo()

  const stats = useMemo(() => {
    const mealsServed = transactions.length
    const revenue = transactions.reduce((s, t) => s + t.amount, 0)
    const lowBalance = students.filter((s) => s.balance >= 0 && s.balance < 10).length
    const negativeBalance = students.filter((s) => s.balance < 0).length
    const participationRate = Math.round((mealsServed / (students.length * 2)) * 100)

    const mealCounts: Record<string, number> = {}
    transactions.forEach((t) => {
      mealCounts[t.meal] = (mealCounts[t.meal] ?? 0) + 1
    })
    const popularMeal = Object.entries(mealCounts).sort(([, a], [, b]) => b - a)[0]

    const lowStock = inventory.filter((i) => i.qty <= i.lowStockThreshold).length
    const wastePercent = 4.2

    return {
      mealsServed,
      revenue,
      lowBalance,
      negativeBalance,
      participationRate,
      popularMeal: popularMeal?.[0] ?? "Lunch",
      popularCount: popularMeal?.[1] ?? 0,
      lowStock,
      wastePercent,
    }
  }, [transactions, students, inventory])

  const forecastData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [{
      label: "Forecasted Meals",
      data: [142, 155, 148, 160, 138],
      borderColor: "#001E62",
      backgroundColor: "rgba(0,30,98,0.08)",
      tension: 0.4,
    }],
  }

  const mealPopularity = {
    labels: ["Breakfast", "Lunch", "A La Carte", "Milk"],
    datasets: [{
      data: [18, 45, 12, 8],
      backgroundColor: ["#001E62", "#00A651", "#F59E0B", "#C8CDD7"],
    }],
  }

  const revenueTrend = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [{
      label: "Revenue",
      data: [820, 945, 890, 1020],
      backgroundColor: "#001E62",
      borderRadius: 8,
    }],
  }

  const widgets = [
    { label: "Meals Served", value: stats.mealsServed.toString(), sub: "Today" },
    { label: "Revenue", value: formatCurrency(stats.revenue), sub: "Period total" },
    { label: "Waste %", value: `${stats.wastePercent}%`, sub: "Below target" },
    { label: "Low Balance", value: stats.lowBalance.toString(), sub: `${stats.negativeBalance} negative` },
    { label: "Popular Meal", value: stats.popularMeal, sub: `${stats.popularCount} served` },
    { label: "Participation", value: `${stats.participationRate}%`, sub: "Daily average" },
  ]

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Analytics</h1>
          <p className="text-silver-foreground">Operational insights and forecasting</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {widgets.map((w) => (
            <Card key={w.label}>
              <CardDescription>{w.label}</CardDescription>
              <p className="mt-1 text-2xl font-bold text-primary">{w.value}</p>
              <p className="text-xs text-silver-foreground">{w.sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Meal Forecasting</CardTitle></CardHeader>
            <Line data={forecastData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Card>
          <Card>
            <CardHeader><CardTitle>Popular Meals</CardTitle></CardHeader>
            <div className="mx-auto max-w-xs">
              <Doughnut data={mealPopularity} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <Bar data={revenueTrend} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Card>
      </div>
    </div>
  )
}
