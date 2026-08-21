export type DataSource = "database" | "demo"

export interface DashboardMetrics {
  revenueToday: number
  inventoryHealth: number
  forecastSummary: string
  wastePercent: number
  participationCount: number
  lowStockCount: number
  totalInventoryItems: number
  /** Students with cafeteria balance below $5 (live roster). */
  lowBalanceCount: number
  /** Students with negative balance (debt). */
  negativeBalanceCount: number
}

export interface ChartSeries {
  labels: string[]
  values: number[]
}

export interface DashboardData {
  source: DataSource
  metrics: DashboardMetrics
  revenueTrend: ChartSeries
  mealsByType: ChartSeries
  participationTrend: ChartSeries
  refreshedAt: string
}

export interface DepletionAlert {
  itemName: string
  daysUntilThreshold: number
  currentQty: number
  threshold: number
}

export interface ForecastData {
  source: DataSource
  nextWeekMeals: number
  confidence: number
  depletion: DepletionAlert[]
  demandByDay: ChartSeries
  participationTrend: ChartSeries
  wasteForecastPercent: number
  orderSuggestions: Array<{ item: string; reason: string }>
  refreshedAt: string
}

export interface ReconciliationRow {
  id: string
  label: string
  cardAmount: number
  receiptAmount: number
  inventoryAmount: number
  status: "matched" | "unmatched" | "pending"
}

export interface MealCostRow {
  mealName: string
  ingredientCost: number
  mealCost: number
  revenue: number
  margin: number
}

export interface ReconciliationData {
  source: DataSource
  rows: ReconciliationRow[]
  mealCosts: MealCostRow[]
  totalRevenue: number
  totalExpenses: number
  netMargin: number
  refreshedAt: string
}

export interface WasteData {
  source: DataSource
  breakdown: { prepared: number; served: number; saved: number; expired: number; discarded: number }
  trend: ChartSeries
  topItems: Array<{ name: string; qty: number; reason: string; estimatedCost?: number }>
  dailyTotalQty: number
  weeklyTotalQty: number
  dailyEstimatedCost: number
  weeklyEstimatedCost: number
  reasons: Array<{ reason: string; qty: number; estimatedCost: number }>
  wastePercent: number
  refreshedAt: string
}

export interface VendorInsight {
  vendor: string
  spend: number
  orderCount: number
  avgLeadDays: number
  trend: "up" | "down" | "stable"
}

export interface NutritionInsight {
  mealName: string
  calories: number
  allergens: string[]
  compliant: boolean
  notes: string
}

export interface AnalyticsData {
  source: DataSource
  waste: WasteData
  vendors: VendorInsight[]
  nutrition: NutritionInsight[]
  participationRate: number
  refreshedAt: string
}

export interface AiSuggestion {
  id: string
  category: "meals" | "purchases" | "inventory" | "seasonal" | "themes"
  title: string
  detail: string
  priority: "high" | "medium" | "low"
}

export interface SuggestionsData {
  source: DataSource
  suggestions: AiSuggestion[]
  refreshedAt: string
}

export interface SeasonalMemoryItem {
  id: string
  title: string
  season: string
  year: number
  type: "menu" | "theme" | "photo" | "pdf"
  previewUrl?: string
  archivedAt: string
}

export interface SeasonalMemoryData {
  source: DataSource
  items: SeasonalMemoryItem[]
  refreshedAt: string
}
