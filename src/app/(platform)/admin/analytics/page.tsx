"use client"

import { useQuery } from "@tanstack/react-query"
import { Bar, Doughnut } from "react-chartjs-2"
import { BarChart3 } from "lucide-react"
import { IntelligenceShell } from "@/components/intelligence/IntelligenceShell"
import { MetricCard } from "@/components/intelligence/MetricCard"
import { ensureChartsRegistered, chartColors } from "@/components/intelligence/chart-setup"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { AnalyticsData } from "@/lib/intelligence/types"
import { INTELLIGENCE_REFETCH_MS } from "@/lib/intelligence/refresh"
import { formatCurrency } from "@/lib/utils"

ensureChartsRegistered()

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/intelligence/analytics")
  if (!res.ok) throw new Error("Failed to load analytics")
  return res.json()
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["intelligence", "analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: INTELLIGENCE_REFETCH_MS,
  })

  const waste = data?.waste.breakdown
  const wasteChart = waste
    ? {
        labels: ["Overproduction", "Served", "Leftover", "Spoiled", "Tray / other"],
        datasets: [{
          data: [waste.prepared, waste.served, waste.saved, waste.expired, waste.discarded],
          backgroundColor: [chartColors.navy, chartColors.green, chartColors.silver, "#F59E0B", chartColors.red],
        }],
      }
    : null

  return (
    <IntelligenceShell
      section="Intelligence"
      title="Analytics"
      description="Waste analytics, nutrition compliance, vendor performance, and participation."
      icon={BarChart3}
      source={data?.source}
    >
      {isLoading && <p className="text-[#AEB6C2]">Loading analytics…</p>}
      {data && (
        <>
          <MetricCard
            label="Participation Rate"
            value={`${data.participationRate}%`}
            hint="Today vs enrolled students"
            variant="success"
          />

          <Tabs defaultValue="waste" className="space-y-6">
            <TabsList>
              <TabsTrigger value="waste">Waste Analytics</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition Compliance</TabsTrigger>
              <TabsTrigger value="vendors">Vendor Center</TabsTrigger>
            </TabsList>

            <TabsContent value="waste" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Today"
                  value={`${data.waste.dailyTotalQty} units`}
                  hint={formatCurrency(data.waste.dailyEstimatedCost)}
                />
                <MetricCard
                  label="This week"
                  value={`${data.waste.weeklyTotalQty} units`}
                  hint={formatCurrency(data.waste.weeklyEstimatedCost)}
                />
                <MetricCard
                  label="Waste share"
                  value={`${data.waste.wastePercent}%`}
                  hint="Of kitchen pull-down this week"
                  variant={data.waste.wastePercent > 5 ? "warning" : "success"}
                />
                <MetricCard
                  label="Top reason"
                  value={data.waste.reasons[0]?.reason ?? "None yet"}
                  hint={
                    data.waste.reasons[0]
                      ? `${data.waste.reasons[0].qty} units · ${formatCurrency(data.waste.reasons[0].estimatedCost)}`
                      : "Log waste in cafeteria to see totals"
                  }
                />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {wasteChart && (
                  <Card className="rounded-[20px] border-[#AEB6C2]/60">
                    <CardHeader>
                      <CardTitle className="text-[#041B52]">Waste Breakdown</CardTitle>
                      <CardDescription>Overproduction, leftover, spoiled, and tray waste from live logs</CardDescription>
                    </CardHeader>
                    <div className="mx-auto h-64 w-64 pb-4">
                      <Doughnut data={wasteChart} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                  </Card>
                )}
                <Card className="rounded-[20px] border-[#AEB6C2]/60">
                  <CardHeader>
                    <CardTitle className="text-[#041B52]">Waste Trend</CardTitle>
                  </CardHeader>
                  <div className="h-64 px-4 pb-4">
                    <Bar
                      data={{
                        labels: data.waste.trend.labels,
                        datasets: [{
                          label: "Waste qty",
                          data: data.waste.trend.values,
                          backgroundColor: chartColors.red,
                          borderRadius: 8,
                        }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </Card>
              </div>
              <Card className="rounded-[20px] border-[#AEB6C2]/60">
                <CardHeader>
                  <CardTitle className="text-[#041B52]">Top Waste Items</CardTitle>
                </CardHeader>
                <div className="space-y-2 px-6 pb-6">
                  {data.waste.topItems.length === 0 && (
                    <p className="text-sm text-[#AEB6C2]">No waste logged this week.</p>
                  )}
                  {data.waste.topItems.map((item) => (
                    <div key={item.name} className="flex justify-between rounded-xl border border-[#AEB6C2]/40 px-4 py-3">
                      <div>
                        <p className="font-medium text-[#041B52]">{item.name}</p>
                        <p className="text-sm text-[#AEB6C2]">
                          {item.reason}
                          {item.estimatedCost != null ? ` · ${formatCurrency(item.estimatedCost)}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline">{item.qty} units</Badge>
                    </div>
                  ))}
                </div>
                {data.waste.reasons.length > 0 && (
                  <div className="space-y-2 px-6 pb-6">
                    <p className="text-sm font-medium text-[#041B52]">Reasons this week</p>
                    {data.waste.reasons.map((row) => (
                      <div key={row.reason} className="flex justify-between text-sm text-[#041B52]">
                        <span className="capitalize">{row.reason}</span>
                        <span>
                          {row.qty} · {formatCurrency(row.estimatedCost)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="nutrition">
              <Card className="rounded-[20px] border-[#AEB6C2]/60">
                <CardHeader>
                  <CardTitle className="text-[#041B52]">Nutrition Compliance</CardTitle>
                  <CardDescription>Calories, allergens, and menu standards from meal templates</CardDescription>
                </CardHeader>
                <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#AEB6C2]/40 text-left text-[#AEB6C2]">
                        <th className="py-2 pr-4">Meal</th>
                        <th className="py-2 pr-4">Calories</th>
                        <th className="py-2 pr-4">Allergens</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.nutrition.map((row) => (
                        <tr key={row.mealName} className="border-b border-[#AEB6C2]/20">
                          <td className="py-3 pr-4 font-medium text-[#041B52]">{row.mealName}</td>
                          <td className="py-3 pr-4">{row.calories ?? "—"}</td>
                          <td className="py-3 pr-4">{row.allergens.join(", ") || "None"}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={row.compliant ? "default" : "danger"}>
                              {row.compliant ? "Compliant" : "Review"}
                            </Badge>
                          </td>
                          <td className="py-3 text-[#AEB6C2]">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="vendors">
              <Card className="rounded-[20px] border-[#AEB6C2]/60">
                <CardHeader>
                  <CardTitle className="text-[#041B52]">Vendor Performance</CardTitle>
                  <CardDescription>Spend, order count, and lead time trends</CardDescription>
                </CardHeader>
                <div className="mobile-scroll-x px-3 pb-6 sm:px-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#AEB6C2]/40 text-left text-[#AEB6C2]">
                        <th className="py-2 pr-4">Vendor</th>
                        <th className="py-2 pr-4">Spend</th>
                        <th className="py-2 pr-4">Orders</th>
                        <th className="py-2 pr-4">Lead Time</th>
                        <th className="py-2">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vendors.map((v) => (
                        <tr key={v.vendor} className="border-b border-[#AEB6C2]/20">
                          <td className="py-3 pr-4 font-medium text-[#041B52]">{v.vendor}</td>
                          <td className="py-3 pr-4">{formatCurrency(v.spend)}</td>
                          <td className="py-3 pr-4">{v.orderCount}</td>
                          <td className="py-3 pr-4">{v.avgLeadDays} days</td>
                          <td className="py-3 capitalize text-[#AEB6C2]">{v.trend}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </IntelligenceShell>
  )
}
