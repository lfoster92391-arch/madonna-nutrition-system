import type {
  AnalyticsData,
  DashboardData,
  ForecastData,
  ReconciliationData,
  SeasonalMemoryData,
  SuggestionsData,
  WasteData,
} from "@/lib/intelligence/types"

const refreshedAt = () => new Date().toISOString()

/** Empty intelligence payloads — used when DB is off or compute fails (no invented metrics). */
export const mockDashboard: DashboardData = {
  source: "database",
  metrics: {
    revenueToday: 0,
    inventoryHealth: 100,
    forecastSummary: "No meal data yet",
    wastePercent: 0,
    participationCount: 0,
    lowStockCount: 0,
    totalInventoryItems: 0,
  },
  revenueTrend: { labels: [], values: [] },
  mealsByType: { labels: [], values: [] },
  participationTrend: { labels: [], values: [] },
  refreshedAt: refreshedAt(),
}

export const mockForecast: ForecastData = {
  source: "database",
  nextWeekMeals: 0,
  confidence: 0,
  depletion: [],
  demandByDay: { labels: [], values: [] },
  participationTrend: { labels: [], values: [] },
  wasteForecastPercent: 0,
  orderSuggestions: [],
  refreshedAt: refreshedAt(),
}

export const mockReconciliation: ReconciliationData = {
  source: "database",
  rows: [],
  mealCosts: [],
  totalRevenue: 0,
  totalExpenses: 0,
  netMargin: 0,
  refreshedAt: refreshedAt(),
}

export const mockWaste: WasteData = {
  source: "database",
  breakdown: { prepared: 0, served: 0, saved: 0, expired: 0, discarded: 0 },
  trend: { labels: [], values: [] },
  topItems: [],
  refreshedAt: refreshedAt(),
}

export const mockAnalytics: AnalyticsData = {
  source: "database",
  waste: mockWaste,
  vendors: [],
  nutrition: [],
  participationRate: 0,
  refreshedAt: refreshedAt(),
}

export const mockSuggestions: SuggestionsData = {
  source: "database",
  suggestions: [],
  refreshedAt: refreshedAt(),
}

export const mockSeasonalMemory: SeasonalMemoryData = {
  source: "database",
  items: [],
  refreshedAt: refreshedAt(),
}
