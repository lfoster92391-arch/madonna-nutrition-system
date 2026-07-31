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

  const [transactions, inventory, signups] = await Promise.all([
    prisma.transaction.findMany({
      where: { schoolId, createdAt: { gte: weekAgo } },
      select: { amount: true, mealType: true, createdAt: true },
    }),
    prisma.inventoryItem.findMany({ where: { schoolId } }),
    prisma.studentLunchSignup.count({
      where: { schoolId, date: { gte: today } },
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
      wastePercent: 0,
      participationCount: todayTx.length,
      lowStockCount,
      totalInventoryItems: inventory.length,
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

export async function computeReconciliation(): Promise<ReconciliationData> {
  const schoolId = await resolveSchoolId()
  const today = startOfDay()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [transactions, templates] = await Promise.all([
    prisma.transaction.findMany({
      where: { schoolId, createdAt: { gte: monthStart } },
      select: { amount: true, mealType: true },
    }),
    prisma.mealTemplate.findMany({
      where: { schoolId, isArchived: false },
      select: { name: true, studentMealPrice: true, alaCartePrice: true },
    }),
  ])

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.amount), 0)
  const mealCounts: Record<string, number> = {}
  transactions.forEach((t) => {
    mealCounts[t.mealType] = (mealCounts[t.mealType] ?? 0) + 1
  })

  const mealCosts = templates.slice(0, 6).map((t) => {
    const price = Number(t.studentMealPrice ?? t.alaCartePrice ?? 4)
    const ingredientCost = price * 0.55
    const mealCost = ingredientCost * 1.15
    const count = mealCounts[t.name] ?? 0
    const revenue = count * price
    return {
      mealName: t.name,
      ingredientCost: Math.round(ingredientCost * 100) / 100,
      mealCost: Math.round(mealCost * 100) / 100,
      revenue: Math.round(revenue * 100) / 100,
      margin: Math.round((revenue - mealCost * count) * 100) / 100,
    }
  })

  const totalExpenses = totalRevenue * 0.73

  return {
    source: "database",
    rows: [],
    mealCosts,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netMargin: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    refreshedAt: new Date().toISOString(),
  }
}

export async function computeWaste(): Promise<WasteData> {
  return {
    source: "database",
    breakdown: { prepared: 0, served: 0, saved: 0, expired: 0, discarded: 0 },
    trend: { labels: [], values: [] },
    topItems: [],
    refreshedAt: new Date().toISOString(),
  }
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
