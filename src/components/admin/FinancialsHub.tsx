"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DollarSign, Plus, ShoppingBasket } from "lucide-react"
import { AdminModulePage } from "@/components/admin/AdminModulePage"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, Label, Select } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReconciliationData } from "@/lib/intelligence/types"
import { currentMonthParam, formatMonthLabel, parseMonthParam } from "@/lib/dates/month-range"
import { formatCurrency } from "@/lib/utils"
import { MonthPicker } from "@/components/admin/MonthPicker"

type GroceryRow = {
  id: string
  vendorName: string
  purchasedAt?: string
  notes?: string
  totalCost: number
  lines: Array<{ name: string; quantity: number; unit: string; unitCost?: number; totalCost?: number }>
}

type GroceriesResponse = {
  source: string
  groceries: GroceryRow[]
  monthSpend: number
}

const UNITS = ["ea", "lb", "oz", "case", "bag", "gal", "box", "pack"]

async function fetchGroceries(month: string): Promise<GroceriesResponse> {
  const res = await fetch(`/api/groceries?month=${encodeURIComponent(month)}`)
  if (!res.ok) throw new Error("Failed to load groceries")
  return res.json()
}

async function fetchReports(month: string): Promise<ReconciliationData> {
  const res = await fetch(`/api/intelligence/reconciliation?month=${encodeURIComponent(month)}`)
  if (!res.ok) throw new Error("Failed to load reports")
  return res.json()
}

function todayInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export function FinancialsHub() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const tabParam = searchParams.get("tab")
  const activeTab =
    tabParam === "expenses" || tabParam === "reports" ? tabParam : "groceries"
  const selectedMonth =
    parseMonthParam(searchParams.get("month")) ?? currentMonthParam()
  const monthLabel = formatMonthLabel(selectedMonth)
  const isCurrentMonth = selectedMonth === currentMonthParam()

  const setSelectedMonth = (month: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (month === currentMonthParam()) params.delete("month")
    else params.set("month", month)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    unit: "ea",
    totalCost: "",
    vendor: "",
    purchasedAt: todayInputValue(),
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const { data: groceryData, isLoading: groceriesLoading } = useQuery({
    queryKey: ["groceries", selectedMonth],
    queryFn: () => fetchGroceries(selectedMonth),
  })

  const { data: reportData, isLoading: reportsLoading } = useQuery({
    queryKey: ["intelligence", "reconciliation", selectedMonth],
    queryFn: () => fetchReports(selectedMonth),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const quantity = Number(form.quantity)
      const totalCost = Number(form.totalCost)
      if (!form.name.trim()) throw new Error("Enter what you bought")
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Enter a quantity greater than 0")
      if (!Number.isFinite(totalCost) || totalCost < 0) throw new Error("Enter how much you paid")

      const res = await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          quantity,
          unit: form.unit.trim() || "ea",
          totalCost,
          vendor: form.vendor.trim() || undefined,
          purchasedAt: form.purchasedAt || undefined,
        }),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(json?.error || "Could not save purchase")
      }
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["groceries"] })
      void queryClient.invalidateQueries({ queryKey: ["inventory"] })
      void queryClient.invalidateQueries({ queryKey: ["receiving"] })
      void queryClient.invalidateQueries({ queryKey: ["intelligence", "reconciliation"] })
      setSavedMessage(`Saved "${form.name.trim()}". Add another anytime.`)
      setFormError(null)
      setForm((f) => ({
        ...f,
        name: "",
        quantity: "1",
        totalCost: "",
        vendor: "",
        purchasedAt: todayInputValue(),
      }))
    },
    onError: (err: Error) => {
      setSavedMessage(null)
      setFormError(err.message)
    },
  })

  const groceries = groceryData?.groceries ?? []
  const monthSpend = groceryData?.monthSpend ?? 0

  const expenseRows = useMemo(
    () =>
      groceries.flatMap((g) =>
        g.lines.map((line, idx) => ({
          key: `${g.id}-${idx}`,
          date: g.purchasedAt,
          item: line.name,
          qty: `${line.quantity} ${line.unit}`,
          vendor: g.vendorName,
          cost:
            typeof line.totalCost === "number"
              ? line.totalCost
              : (line.unitCost ?? 0) * line.quantity,
        }))
      ),
    [groceries]
  )

  return (
    <AdminModulePage
      section="Financials"
      title="Financials"
      description="Add grocery purchases, review what you spent, and check meal revenue — plain and simple."
      icon={DollarSign}
      stats={[
        {
          label: isCurrentMonth ? "This month’s groceries" : `Groceries (${monthLabel})`,
          value: formatCurrency(monthSpend),
          hint: groceries.length ? `${groceries.length} purchases in ${monthLabel}` : "None in this month",
        },
        {
          label: isCurrentMonth ? "Meal revenue (month)" : `Meal revenue (${monthLabel})`,
          value: formatCurrency(reportData?.totalRevenue ?? 0),
          variant: "success",
        },
      ]}
    >
      <MonthPicker value={selectedMonth} onChange={setSelectedMonth} className="mb-2" />
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const params = new URLSearchParams(searchParams.toString())
          if (value === "groceries") params.delete("tab")
          else params.set("tab", value)
          const qs = params.toString()
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
        }}
        className="min-w-0 space-y-6"
      >
        <div className="-mx-1 min-w-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex w-max flex-nowrap sm:w-full">
            <TabsTrigger value="groceries" className="flex-none px-5 sm:flex-1">
              Groceries
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex-none px-5 sm:flex-1">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-none px-5 sm:flex-1">
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="groceries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingBasket className="h-5 w-5" />
                Add a grocery purchase
              </CardTitle>
              <CardDescription>
                Fill in what you bought and tap Save. It goes straight onto your grocery list and inventory.
              </CardDescription>
            </CardHeader>
            <form
              className="grid gap-4 px-4 pb-6 sm:grid-cols-2 sm:px-6"
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
            >
              <div className="sm:col-span-2">
                <Label htmlFor="grocery-name">What did you buy?</Label>
                <Input
                  id="grocery-name"
                  className="mt-1"
                  placeholder="e.g. Milk, apples, chicken breasts"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="off"
                />
              </div>

              <div>
                <Label htmlFor="grocery-qty">How many?</Label>
                <Input
                  id="grocery-qty"
                  className="mt-1"
                  type="number"
                  min={0.01}
                  step="any"
                  inputMode="decimal"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="grocery-unit">Unit</Label>
                <Select
                  id="grocery-unit"
                  className="mt-1"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="grocery-cost">How much did you pay?</Label>
                <Input
                  id="grocery-cost"
                  className="mt-1"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={form.totalCost}
                  onChange={(e) => setForm((f) => ({ ...f, totalCost: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="grocery-date">Purchase date</Label>
                <Input
                  id="grocery-date"
                  className="mt-1"
                  type="date"
                  value={form.purchasedAt}
                  onChange={(e) => setForm((f) => ({ ...f, purchasedAt: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="grocery-vendor">Store / vendor (optional)</Label>
                <Input
                  id="grocery-vendor"
                  className="mt-1"
                  placeholder="e.g. Costco, Sysco, Hy-Vee"
                  value={form.vendor}
                  onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                  autoComplete="organization"
                />
              </div>

              {formError && (
                <p className="sm:col-span-2 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {formError}
                </p>
              )}
              {savedMessage && (
                <p className="sm:col-span-2 rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-sm text-success">
                  {savedMessage}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="sm:col-span-2 w-full"
                disabled={saveMutation.isPending}
              >
                <Plus className="h-5 w-5" />
                {saveMutation.isPending ? "Saving…" : "Save purchase"}
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent groceries</CardTitle>
              <CardDescription>
                {isCurrentMonth
                  ? "Purchases this month, newest first"
                  : `Purchases in ${monthLabel}, newest first`}
              </CardDescription>
            </CardHeader>
            <div className="space-y-3 px-4 pb-6 sm:px-6">
              {groceriesLoading && <p className="text-sm text-silver-foreground">Loading…</p>}
              {!groceriesLoading && groceries.length === 0 && (
                <div className="rounded-2xl border border-dashed border-silver/70 bg-silver/10 px-4 py-10 text-center">
                  <ShoppingBasket className="mx-auto h-10 w-10 text-primary/70" />
                  <p className="mt-3 text-lg font-semibold text-primary">No groceries yet</p>
                  <p className="mt-1 text-sm text-silver-foreground">
                    No groceries recorded for {monthLabel}.
                    {isCurrentMonth ? " Add your first purchase using the form above." : " Try another month or add a purchase with that date."}
                  </p>
                </div>
              )}
              {groceries.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col gap-2 rounded-2xl border border-silver/50 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-primary">
                      {g.lines.map((l) => l.name).join(", ")}
                    </p>
                    <p className="mt-1 text-sm text-silver-foreground">
                      {g.lines.map((l) => `${l.quantity} ${l.unit}`).join(" · ")}
                      {g.vendorName ? ` · ${g.vendorName}` : ""}
                    </p>
                    {g.purchasedAt && (
                      <p className="mt-1 text-xs text-silver-foreground">
                        {new Date(g.purchasedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <p className="text-xl font-bold tabular-nums text-primary">
                    {formatCurrency(g.totalCost)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grocery expenses</CardTitle>
              <CardDescription>
                Grocery purchases in {monthLabel}. Parent card payments are separate.
              </CardDescription>
            </CardHeader>
            <div className="px-4 pb-6 sm:px-6">
              {groceriesLoading && <p className="text-sm text-silver-foreground">Loading…</p>}
              {!groceriesLoading && expenseRows.length === 0 && (
                <div className="rounded-2xl border border-dashed border-silver/70 bg-silver/10 px-4 py-10 text-center">
                  <p className="text-lg font-semibold text-primary">No expenses yet</p>
                  <p className="mt-1 text-sm text-silver-foreground">
                    No grocery expenses in {monthLabel}.
                  </p>
                  <Button asChild className="mt-4" size="lg">
                    <Link href="/admin/finance?tab=groceries">Add a grocery</Link>
                  </Button>
                </div>
              )}
              {expenseRows.length > 0 && (
                <ul className="divide-y divide-silver/40">
                  {expenseRows.map((row) => (
                    <li
                      key={row.key}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-primary">{row.item}</p>
                        <p className="text-sm text-silver-foreground">
                          {row.qty}
                          {row.vendor ? ` · ${row.vendor}` : ""}
                          {row.date ? ` · ${new Date(row.date).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCurrency(row.cost)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {reportsLoading && <p className="text-silver-foreground">Loading reports…</p>}
          {reportData && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Meal revenue ({monthLabel})</CardDescription>
                    <CardTitle className="text-2xl text-success">
                      {formatCurrency(reportData.totalRevenue)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Grocery spend ({monthLabel})</CardDescription>
                    <CardTitle className="text-2xl">
                      {formatCurrency(reportData.totalExpenses)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Net (revenue − groceries)</CardDescription>
                    <CardTitle className="text-2xl">
                      {formatCurrency(reportData.netMargin)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>What’s included</CardTitle>
                  <CardDescription>
                    Revenue comes from real meal and deposit activity. Expenses come from grocery
                    purchases you enter — nothing is invented.
                  </CardDescription>
                </CardHeader>
                <div className="space-y-3 px-4 pb-6 text-sm text-silver-foreground sm:px-6">
                  {reportData.totalRevenue === 0 && reportData.totalExpenses === 0 ? (
                    <div className="rounded-2xl border border-dashed border-silver/70 bg-silver/10 px-4 py-8 text-center">
                      <p className="font-semibold text-primary">No financial activity yet</p>
                      <p className="mt-1">
                        Add groceries under Groceries, or wait for meal sales and parent payments to
                        show revenue.
                      </p>
                    </div>
                  ) : (
                    <p>
                      Parent Stripe / Add Funds payments still run through the parent portal and
                      student accounts — this screen only summarizes cafeteria grocery spend vs meal
                      revenue.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild variant="outline">
                      <Link href="/admin/inventory">View inventory</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/transactions">View transactions</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AdminModulePage>
  )
}
