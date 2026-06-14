export {
  DEMO_MOVEMENTS,
  DEMO_OPS_INVENTORY as DEMO_INVENTORY,
  DEMO_PRODUCTION_ORDERS,
  DEMO_RECEIPT_SCANS,
  DEMO_RECEIVING,
  DEMO_STORAGE_LOCATIONS,
} from "@/lib/operations/demo-data"

export type {
  ProductionOrderStatus,
  ReceiptScanStatus,
  ReceivingStatus,
} from "@/lib/operations/types"

export type { ReceivingLine } from "@/lib/operations/types"

export type DemoReceivingRecord = import("@/lib/operations/types").ReceivingRecord
export type DemoReceiptScan = import("@/lib/operations/types").ReceiptScan
export type DemoProductionOrder = import("@/lib/operations/types").ProductionOrder

export const DEMO_FORECAST = {
  nextWeekMeals: 920,
  trendPercent: 4.2,
  topMeal: "Chicken Wrap",
  confidence: 87,
}

export const DEMO_FINANCE = {
  monthRevenue: 42850,
  monthExpenses: 31200,
  avgMealCost: 3.42,
  fundBalance: 11650,
}
