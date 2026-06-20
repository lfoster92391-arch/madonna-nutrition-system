"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { DollarSign, Download } from "lucide-react"
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell"
import { MetricCard } from "@/components/intelligence/MetricCard"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { ReconciliationData } from "@/lib/intelligence/types"
import { downloadReportCsv } from "@/lib/export/download-report"
import { formatCurrency } from "@/lib/utils"

async function fetchReconciliation(): Promise<ReconciliationData> {
  const res = await fetch("/api/intelligence/reconciliation")
  if (!res.ok) throw new Error("Failed to load reconciliation")
  return res.json()
}

const statusStyles = {
  matched: "bg-[#00A83E]/15 text-[#00A83E]",
  unmatched: "bg-[#D62828]/10 text-[#D62828]",
  pending: "bg-amber-100 text-amber-800",
}

export default function AdminFinancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "reconciliation"],
    queryFn: fetchReconciliation,
  })

  return (
    <IntelligenceShell
      section="Intelligence"
      title="Financial Reconciliation"
      description="Match card transactions, receipts, and inventory receives — read-only executive view."
      icon={DollarSign}
      source={data?.source}
      actions={
        <Button variant="outline" size="sm" type="button" onClick={() => downloadReportCsv("reconciliation")}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      }
    >
      {isLoading && <p className="text-[#AEB6C2]">Loading finance data…</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Month Revenue" value={formatCurrency(data.totalRevenue)} variant="success" />
            <MetricCard label="Month Expenses" value={formatCurrency(data.totalExpenses)} />
            <MetricCard label="Net Margin" value={formatCurrency(data.netMargin)} variant="success" />
          </div>

          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">Reconciliation Status</CardTitle>
              <CardDescription>Card vs receipt vs inventory receive matching</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#AEB6C2]/40 text-left text-[#AEB6C2]">
                    <th className="py-2 pr-4">Entry</th>
                    <th className="py-2 pr-4">Card</th>
                    <th className="py-2 pr-4">Receipt</th>
                    <th className="py-2 pr-4">Inventory</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#AEB6C2]/20">
                      <td className="py-3 pr-4 font-medium text-[#041B52]">{row.label}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.cardAmount)}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.receiptAmount)}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.inventoryAmount)}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${statusStyles[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="rounded-[20px] border-[#AEB6C2]/60">
            <CardHeader>
              <CardTitle className="text-[#041B52]">Meal Cost Engine</CardTitle>
              <CardDescription>Ingredient cost, meal cost, revenue, and margins by template</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto px-6 pb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#AEB6C2]/40 text-left text-[#AEB6C2]">
                    <th className="py-2 pr-4">Meal</th>
                    <th className="py-2 pr-4">Ingredient</th>
                    <th className="py-2 pr-4">Meal Cost</th>
                    <th className="py-2 pr-4">Revenue</th>
                    <th className="py-2">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mealCosts.map((row) => (
                    <tr key={row.mealName} className="border-b border-[#AEB6C2]/20">
                      <td className="py-3 pr-4 font-medium text-[#041B52]">{row.mealName}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.ingredientCost)}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.mealCost)}</td>
                      <td className="py-3 pr-4">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 font-semibold text-[#00A83E]">{formatCurrency(row.margin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Button asChild variant="outline">
            <Link href="/transactions">View transaction details</Link>
          </Button>
        </>
      )}
    </IntelligenceShell>
  )
}
