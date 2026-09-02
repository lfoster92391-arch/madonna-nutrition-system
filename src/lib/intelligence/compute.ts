import { prisma } from "@/lib/prisma"
import { resolveSchoolId } from "@/lib/db/school"
import {
  mockAnalytics,
  mockDashboard,
  mockForecast,
  mockReconciliation,
  mockSeasonalMemory,
  mockSuggestions,
  mockWaste,
} from "@/data/mockIntelligence"
import type {
  AnalyticsData,
  DashboardData,
  ForecastData,
  ReconciliationData,
  SeasonalMemoryData,
  SuggestionsData,
  WasteData,
} from "@/lib/intelligence/types"
import {
  currentMonthParam,
  monthRangeFromParam,
  parseMonthParam,
} from "@/lib/dates/month-range"

export async function tryCompute<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error("Intelligence compute failed, using empty fallback:", error)
    return fallback
  }
}

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function dayLabels(count: number) {
  const labels: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    labels.push(d.toLocaleDateString("en-US", { weekday: "short" }))
  }
  return labels
}

export async function computeDashboard(): Promise<DashboardData> {
  const schoolId = await resolveSchoolId()
  const today = startOfDay()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [transactions, inventory, signups, wasteData, lowBalanceCount, negativeBalanceCount] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { schoolId, createdAt: { gte: weekAgo } },
        select: { amount: true, mealType: true, createdAt: true },
      }),
      prisma.inventoryItem.findMany({ where: { schoolId } }),
      prisma.studentLunchSignup.count({
        where: { schoolId, date: { gte: today } },
      }),
      computeWaste(),
      prisma.student.count({
        where: { schoolId, disabled: false, balance: { lt: 5 } },
      }),
      prisma.student.count({
        where: { schoolId, disabled: false, balance: { lt: 0 } },
      }),
    ])

  const todayTx = transactions.filter((t) => t.createdAt >= today)
  const revenueToday = todayTx.reduce((s, t) => s + Number(t.amount), 0)
  const lowStockCount = inventory.filter((i) => i.qty <= i.lowStockThreshold).length
  const inventoryHealth =
    inventory.length === 0
      ? 100
      : Math.round(((inventory.length - lowStockCount) / inventory.length) * 100)

  const mealCounts: Record<string, number> = {}
  todayTx.forEach((t) => {
    mealCounts[t.mealType] = (mealCounts[t.mealType] ?? 0) + 1
  })

  const revenueByDay = dayLabels(7).map((_, idx) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - idx))
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    return transactions
      .filter((t) => t.createdAt >= d && t.createdAt < next)
      .reduce((s, t) => s + Number(t.amount), 0)
  })

  return {
    source: "database",
    metrics: {
      revenueToday,
      inventoryHealth,
      forecastSummary:
        signups + todayTx.length > 0
          ? `${signups + todayTx.length} meals projected from signups + today`
          : "No meal data yet",
      wastePercent: wasteData.wastePercent,
      participationCount: todayTx.length,
      lowStockCount,
      totalInventoryItems: inventory.length,
      lowBalanceCount,
      negativeBalanceCount,
    },
    revenueTrend: { labels: dayLabels(7), values: revenueByDay },
    mealsByType: {
      labels: Object.keys(mealCounts),
      values: Object.values(mealCounts),
    },
    participationTrend: { labels: [], values: [] },
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeForecast(): Promise<ForecastData> {
  const schoolId = await resolveSchoolId()
  const today = startOfDay()
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const [inventory, events, signups, transactions] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { schoolId } }),
    prisma.calendarEvent.findMany({
      where: { schoolId, date: { gte: today, lt: nextWeek } },
    }),
    prisma.studentLunchSignup.findMany({
      where: { schoolId, date: { gte: today, lt: nextWeek } },
    }),
    prisma.transaction.findMany({
      where: { schoolId, createdAt: { gte: new Date(today.getTime() - 14 * 86400000) } },
    }),
  ])

  const avgDailyMeals = transactions.length > 0 ? transactions.length / 14 : 0
  const depletion = inventory
    .filter((i) => i.qty <= i.lowStockThreshold * 2)
    .slice(0, 5)
    .map((i) => ({
      itemName: i.name,
      daysUntilThreshold: Math.max(
        1,
        Math.round(i.qty / Math.max(avgDailyMeals / 50, 1))
      ),
      currentQty: i.qty,
      threshold: i.lowStockThreshold,
    }))

  const demandByDay: Record<string, number> = {}
  if (avgDailyMeals > 0) {
    events.forEach((e) => {
      const key = e.date.toLocaleDateString("en-US", { weekday: "short" })
      demandByDay[key] = (demandByDay[key] ?? 0) + Math.round(avgDailyMeals)
    })
  }
  signups.forEach((s) => {
    const key = s.date.toLocaleDateString("en-US", { weekday: "short" })
    demandByDay[key] = (demandByDay[key] ?? 0) + 1
  })

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  const values = labels.map((l) => demandByDay[l] ?? 0)

  return {
    source: "database",
    nextWeekMeals: values.reduce((a, b) => a + b, 0),
    confidence: events.length || signups.length ? Math.min(95, 70 + events.length * 3) : 0,
    depletion,
    demandByDay: { labels, values },
    participationTrend: {
      labels,
      values: values.map((v) => (v > 0 ? Math.min(100, Math.round((v / 200) * 100)) : 0)),
    },
    wasteForecastPercent: 0,
    orderSuggestions: depletion.map((d) => ({
      item: d.itemName,
      reason: `${d.daysUntilThreshold} days until par at current usage`,
    })),
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeReconciliation(monthParam?: string): Promise<ReconciliationData> {
  const schoolId = await resolveSchoolId()
  const month = parseMonthParam(monthParam) ?? currentMonthParam()
  const { start: monthStart, end: monthEnd } = monthRangeFromParam(month)

  const [transactions, receiving] = await Promise.all([
    prisma.transaction.findMany({
      where: { schoolId, createdAt: { gte: monthStart, lte: monthEnd } },
      select: { amount: true, mealType: true },
    }),
    prisma.receivingRecord.findMany({
      where: {
        schoolId,
        status: "approved",
        OR: [
          { receivedAt: { gte: monthStart, lte: monthEnd } },
          { approvedAt: { gte: monthStart, lte: monthEnd } },
          {
            AND: [
              { receivedAt: null },
              { approvedAt: null },
              { createdAt: { gte: monthStart, lte: monthEnd } },
            ],
          },
        ],
      },
      select: { lines: true },
    }),
  ])

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.amount), 0)

  const totalExpenses = receiving.reduce((sum, record) => {
    if (!Array.isArray(record.lines)) return sum
    const lines = record.lines as Array<{ quantity?: number; unitCost?: number; totalCost?: number }>
    const recordTotal = lines.reduce((lineSum, line) => {
      if (typeof line.totalCost === "number") return lineSum + line.totalCost
      return lineSum + (Number(line.unitCost) || 0) * (Number(line.quantity) || 0)
    }, 0)
    return sum + recordTotal
  }, 0)

  return {
    source: "database",
    month,
    rows: [],
    mealCosts: [],
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netMargin: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeWaste(): Promise<WasteData> {
  const schoolId = await resolveSchoolId()
  const today = startOfDay()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [wasteMovements, outgoingMovements, productionOrders] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: { schoolId, type: "waste", createdAt: { gte: weekAgo } },
      include: { inventoryItem: { select: { name: true, cost: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inventoryMovement.findMany({
      where: {
        schoolId,
        type: { in: ["waste", "usage", "production"] },
        createdAt: { gte: weekAgo },
      },
      select: { type: true, quantity: true },
    }),
    prisma.productionOrder.findMany({
      where: { schoolId, updatedAt: { gte: weekAgo } },
      select: { wasteLog: true, updatedAt: true },
    }),
  ])

  const itemIds = new Set<string>()
  type WasteRow = {
    itemId: string
    name: string
    qty: number
    cost: number
    reason: string
    at: Date
  }
  const rows: WasteRow[] = wasteMovements.map((m) => {
    itemIds.add(m.inventoryItemId)
    return {
      itemId: m.inventoryItemId,
      name: m.inventoryItem.name,
      qty: Math.abs(m.quantity),
      cost: Number(m.inventoryItem.cost) || 0,
      reason: parseWasteReason(m.note),
      at: m.createdAt,
    }
  })

  const movementKeys = new Set(
    wasteMovements.map(
      (m) => `${m.inventoryItemId}:${Math.abs(m.quantity)}:${m.createdAt.toISOString().slice(0, 16)}`
    )
  )

  for (const order of productionOrders) {
    const log = Array.isArray(order.wasteLog) ? order.wasteLog : []
    for (const entry of log) {
      if (!entry || typeof entry !== "object") continue
      const rec = entry as { itemId?: string; quantity?: number; note?: string; at?: string }
      const itemId = rec.itemId
      const qty = Math.abs(Number(rec.quantity) || 0)
      if (!itemId || qty <= 0) continue
      const at = rec.at ? new Date(rec.at) : order.updatedAt
      if (Number.isNaN(at.getTime()) || at < weekAgo) continue
      const key = `${itemId}:${qty}:${at.toISOString().slice(0, 16)}`
      if (movementKeys.has(key)) continue
      itemIds.add(itemId)
      rows.push({
        itemId,
        name: "",
        qty,
        cost: 0,
        reason: parseWasteReason(rec.note),
        at,
      })
    }
  }

  if (itemIds.size > 0) {
    const missingNames = rows.filter((r) => !r.name).map((r) => r.itemId)
    if (missingNames.length > 0) {
      const items = await prisma.inventoryItem.findMany({
        where: { id: { in: [...new Set(missingNames)] } },
        select: { id: true, name: true, cost: true },
      })
      const map = Object.fromEntries(items.map((i) => [i.id, i]))
      for (const row of rows) {
        if (!row.name && map[row.itemId]) {
          row.name = map[row.itemId].name
          row.cost = Number(map[row.itemId].cost) || 0
        }
      }
    }
  }

  const estimated = (row: WasteRow) => Math.round(row.qty * row.cost * 100) / 100
  const todayRows = rows.filter((r) => r.at >= today)
  const weekRows = rows.filter((r) => r.at >= weekAgo)

  const sumQty = (list: WasteRow[]) => list.reduce((s, r) => s + r.qty, 0)
  const sumCost = (list: WasteRow[]) =>
    Math.round(list.reduce((s, r) => s + estimated(r), 0) * 100) / 100

  const reasonMap = new Map<string, { qty: number; estimatedCost: number }>()
  for (const row of weekRows) {
    const current = reasonMap.get(row.reason) ?? { qty: 0, estimatedCost: 0 }
    current.qty += row.qty
    current.estimatedCost += estimated(row)
    reasonMap.set(row.reason, current)
  }

  const itemMap = new Map<string, { qty: number; reason: string; estimatedCost: number }>()
  for (const row of weekRows) {
    const key = row.name || "Unknown item"
    const current = itemMap.get(key) ?? { qty: 0, reason: row.reason, estimatedCost: 0 }
    current.qty += row.qty
    current.estimatedCost += estimated(row)
    if (row.qty >= (itemMap.get(key)?.qty ?? 0)) current.reason = row.reason
    itemMap.set(key, current)
  }

  const topItems = [...itemMap.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 8)
    .map(([name, v]) => ({
      name,
      qty: v.qty,
      reason: v.reason,
      estimatedCost: Math.round(v.estimatedCost * 100) / 100,
    }))

  const labels = dayLabels(7)
  const trendValues = labels.map((_, idx) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - idx))
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    return weekRows.filter((r) => r.at >= d && r.at < next).reduce((s, r) => s + r.qty, 0)
  })

  const spoiledQty = weekRows.filter((r) => r.reason === "spoiled").reduce((s, r) => s + r.qty, 0)
  const leftoverQty = weekRows.filter((r) => r.reason === "leftover").reduce((s, r) => s + r.qty, 0)
  const overproductionQty = weekRows
    .filter((r) => r.reason === "overproduction")
    .reduce((s, r) => s + r.qty, 0)
  const discardedQty = weekRows
    .filter((r) => r.reason === "tray waste" || r.reason === "other")
    .reduce((s, r) => s + r.qty, 0)

  const wasteQty = outgoingMovements
    .filter((m) => m.type === "waste")
    .reduce((s, m) => s + Math.abs(m.quantity), 0)
  const outgoingQty = outgoingMovements.reduce((s, m) => s + Math.abs(m.quantity), 0)
  const wastePercent = outgoingQty > 0 ? Math.round((wasteQty / outgoingQty) * 100) : 0

  return {
    source: "database",
    breakdown: {
      prepared: overproductionQty,
      served: 0,
      saved: leftoverQty,
      expired: spoiledQty,
      discarded: discardedQty,
    },
    trend: { labels, values: trendValues },
    topItems,
    dailyTotalQty: sumQty(todayRows),
    weeklyTotalQty: sumQty(weekRows),
    dailyEstimatedCost: sumCost(todayRows),
    weeklyEstimatedCost: sumCost(weekRows),
    reasons: [...reasonMap.entries()]
      .sort((a, b) => b[1].qty - a[1].qty)
      .map(([reason, v]) => ({
        reason,
        qty: v.qty,
        estimatedCost: Math.round(v.estimatedCost * 100) / 100,
      })),
    wastePercent,
    refreshedAt: new Date().toISOString(),
  }
}

const WASTE_REASONS = ["leftover", "tray waste", "overproduction", "spoiled", "other"] as const

function parseWasteReason(note?: string | null): string {
  const n = (note ?? "").toLowerCase()
  for (const reason of WASTE_REASONS) {
    if (n.includes(reason)) return reason
  }
  if (n.includes("expir") || n.includes("spoil")) return "spoiled"
  if (n.includes("production") || n.includes("overprod")) return "overproduction"
  if (n.includes("tray")) return "tray waste"
  return "other"
}

export async function computeAnalytics(): Promise<AnalyticsData> {
  const schoolId = await resolveSchoolId()
  const templates = await prisma.mealTemplate.findMany({
    where: { schoolId, isArchived: false },
    select: { name: true, allergens: true, nutritionNotes: true },
    take: 10,
  })

  const nutrition = templates.map((t) => ({
    mealName: t.name,
    calories: t.nutritionNotes?.match(/\d+/) ? Number(t.nutritionNotes.match(/\d+/)![0]) : 0,
    allergens: t.allergens,
    compliant: t.allergens.length <= 3,
    notes: t.nutritionNotes ?? "No nutrition notes on file",
  }))

  const [students, todayMeals] = await Promise.all([
    prisma.student.count({ where: { schoolId, disabled: false } }),
    prisma.transaction.count({
      where: { schoolId, createdAt: { gte: startOfDay() } },
    }),
  ])

  return {
    source: "database",
    waste: await computeWaste(),
    vendors: [],
    nutrition,
    participationRate: students ? Math.round((todayMeals / students) * 100) : 0,
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeSuggestions(): Promise<SuggestionsData> {
  const schoolId = await resolveSchoolId()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [transactions, lowInventory, templates] = await Promise.all([
    prisma.transaction.findMany({
      where: { schoolId, createdAt: { gte: weekAgo } },
      select: { mealType: true },
    }),
    prisma.inventoryItem.findMany({ where: { schoolId } }),
    prisma.mealTemplate.findMany({
      where: { schoolId, isFavorite: true },
      select: { name: true },
      take: 3,
    }),
  ])

  const inventory = lowInventory.filter((i) => i.qty <= i.lowStockThreshold)

  const mealCounts: Record<string, number> = {}
  transactions.forEach((t) => {
    mealCounts[t.mealType] = (mealCounts[t.mealType] ?? 0) + 1
  })
  const topMeal = Object.entries(mealCounts).sort(([, a], [, b]) => b - a)[0]

  const suggestions: SuggestionsData["suggestions"] = []
  if (topMeal) {
    suggestions.push({
      id: "db-top-meal",
      category: "meals",
      title: `Feature ${topMeal[0]}`,
      detail: `Served ${topMeal[1]}× this week from transaction data.`,
      priority: "high",
    })
  }
  inventory.slice(0, 2).forEach((item, idx) => {
    suggestions.push({
      id: `db-inv-${idx}`,
      category: "purchases",
      title: `Reorder ${item.name}`,
      detail: `Qty ${item.qty} at or below par (${item.lowStockThreshold}).`,
      priority: "high",
    })
  })
  templates.forEach((t, idx) => {
    suggestions.push({
      id: `db-fav-${idx}`,
      category: "seasonal",
      title: `Favorite: ${t.name}`,
      detail: "Marked favorite in meal library — consider scheduling again.",
      priority: "low",
    })
  })

  return {
    source: "database",
    suggestions: suggestions.slice(0, 8),
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeSeasonalMemory(): Promise<SeasonalMemoryData> {
  const schoolId = await resolveSchoolId()
  const archived = await prisma.mealTemplate.findMany({
    where: { schoolId, isArchived: true },
    select: {
      id: true,
      name: true,
      category: true,
      updatedAt: true,
      photos: { take: 1, select: { url: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  })

  if (!archived.length) {
    return {
      source: "database",
      items: [],
      refreshedAt: new Date().toISOString(),
    }
  }

  return {
    source: "database",
    items: archived.map((t) => ({
      id: t.id,
      title: t.name,
      season: t.category,
      year: t.updatedAt.getFullYear(),
      type: t.photos[0] ? "photo" : "menu",
      previewUrl: t.photos[0]?.url,
      archivedAt: t.updatedAt.toISOString(),
    })),
    refreshedAt: new Date().toISOString(),
  }
}

export {
  mockDashboard,
  mockForecast,
  mockReconciliation,
  mockWaste,
  mockAnalytics,
  mockSuggestions,
  mockSeasonalMemory,
}
