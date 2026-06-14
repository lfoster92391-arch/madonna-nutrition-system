"use client"

import { useMemo, useState } from "react"
import { Download, FileText } from "lucide-react"
import {
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
import { Bar, Line } from "react-chartjs-2"
import { useDemo } from "@/components/providers/DemoProvider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function TransactionsPage() {
  const { transactions, students } = useDemo()
  const [dateFilter, setDateFilter] = useState("")
  const [mealFilter, setMealFilter] = useState("")
  const [studentFilter, setStudentFilter] = useState("")

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (mealFilter && tx.meal !== mealFilter) return false
      if (studentFilter && tx.studentId !== studentFilter) return false
      if (dateFilter) {
        const txDate = new Date(tx.timestamp).toISOString().split("T")[0]
        if (txDate !== dateFilter) return false
      }
      return true
    })
  }, [transactions, dateFilter, mealFilter, studentFilter])

  const mealsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((tx) => {
      counts[tx.meal] = (counts[tx.meal] ?? 0) + 1
    })
    return counts
  }, [filtered])

  const revenueByDay = useMemo(() => {
    const rev: Record<string, number> = {}
    filtered.forEach((tx) => {
      const day = new Date(tx.timestamp).toLocaleDateString()
      rev[day] = (rev[day] ?? 0) + tx.amount
    })
    return rev
  }, [filtered])

  const mealsChart = {
    labels: Object.keys(mealsByType),
    datasets: [{
      label: "Meals Served",
      data: Object.values(mealsByType),
      backgroundColor: "#001E62",
      borderRadius: 8,
    }],
  }

  const financialChart = {
    labels: Object.keys(revenueByDay),
    datasets: [{
      label: "Revenue ($)",
      data: Object.values(revenueByDay),
      borderColor: "#00A651",
      backgroundColor: "rgba(0,166,81,0.1)",
      tension: 0.3,
    }],
  }

  function exportCsv() {
    const header = "Time,Student,Meal,Amount,Balance After\n"
    const rows = filtered.map(
      (tx) =>
        `${tx.timestamp},${tx.studentName},${tx.meal},${tx.amount},${tx.balanceAfter}`
    )
    const blob = new Blob([header + rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Transaction Center</h1>
            <p className="text-silver-foreground">Filter, analyze, and export meal transactions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
            <div>
              <Label>Meal</Label>
              <Select value={mealFilter} onChange={(e) => setMealFilter(e.target.value)}>
                <option value="">All Meals</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="A La Carte">A La Carte</option>
                <option value="Milk">Milk</option>
              </Select>
            </div>
            <div>
              <Label>Student</Label>
              <Select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)}>
                <option value="">All Students</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Meals Served</CardTitle></CardHeader>
            <Bar data={mealsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Card>
          <Card>
            <CardHeader><CardTitle>Financial Overview</CardTitle></CardHeader>
            <Line data={financialChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Transaction Log</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver/60 text-silver-foreground">
                  <th className="pb-3 pr-4 text-left font-medium">Time</th>
                  <th className="pb-3 pr-4 text-left font-medium">Student</th>
                  <th className="pb-3 pr-4 text-left font-medium">Meal</th>
                  <th className="pb-3 pr-4 text-right font-medium">Amount</th>
                  <th className="pb-3 text-right font-medium">Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-silver/30">
                    <td className="py-3 pr-4">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="py-3 pr-4 font-medium text-primary">{tx.studentName}</td>
                    <td className="py-3 pr-4">{tx.meal}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatCurrency(tx.amount)}</td>
                    <td className="py-3 text-right tabular-nums">{formatCurrency(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
