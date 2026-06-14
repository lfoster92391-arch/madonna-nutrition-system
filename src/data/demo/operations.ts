export type ReceivingStatus = "draft" | "pending_approval" | "approved" | "rejected"
export type ReceiptScanStatus = "pending" | "unmatched" | "matched"
export type ProductionOrderStatus = "planned" | "in_progress" | "completed" | "cancelled"

export interface ReceivingLine {
  name: string
  quantity: number
  unit: string
}

export interface DemoReceivingRecord {
  id: string
  vendorName: string
  invoiceNumber?: string
  status: ReceivingStatus
  lines: ReceivingLine[]
  receivedAt: string
}

export interface DemoReceiptScan {
  id: string
  fileName: string
  vendorGuess?: string
  status: ReceiptScanStatus
  createdAt: string
}

export interface DemoProductionOrder {
  id: string
  title: string
  status: ProductionOrderStatus
  scheduledFor: string
  portionsPlanned: number
  portionsMade: number
}

export const DEMO_RECEIVING: DemoReceivingRecord[] = [
  {
    id: "rcv-1",
    vendorName: "Sysco Foods",
    invoiceNumber: "INV-88421",
    status: "pending_approval",
    receivedAt: "2026-06-13T14:30:00.000Z",
    lines: [
      { name: "Chicken Breast", quantity: 40, unit: "lb" },
      { name: "Whole Wheat Buns", quantity: 120, unit: "ea" },
    ],
  },
  {
    id: "rcv-2",
    vendorName: "Local Produce Co.",
    status: "approved",
    receivedAt: "2026-06-12T09:15:00.000Z",
    lines: [
      { name: "Romaine Lettuce", quantity: 24, unit: "head" },
      { name: "Cherry Tomatoes", quantity: 10, unit: "lb" },
    ],
  },
]

export const DEMO_RECEIPT_SCANS: DemoReceiptScan[] = [
  {
    id: "rcp-1",
    fileName: "sysco-june-13.pdf",
    vendorGuess: "Sysco Foods",
    status: "matched",
    createdAt: "2026-06-13T15:00:00.000Z",
  },
  {
    id: "rcp-2",
    fileName: "unknown-vendor.jpg",
    status: "unmatched",
    createdAt: "2026-06-13T11:20:00.000Z",
  },
]

export const DEMO_PRODUCTION_ORDERS: DemoProductionOrder[] = [
  {
    id: "prod-1",
    title: "Tuesday Hot Lunch — Chicken Wraps",
    status: "in_progress",
    scheduledFor: "2026-06-14T11:00:00.000Z",
    portionsPlanned: 185,
    portionsMade: 92,
  },
  {
    id: "prod-2",
    title: "Wednesday Salad Bar",
    status: "planned",
    scheduledFor: "2026-06-15T11:00:00.000Z",
    portionsPlanned: 160,
    portionsMade: 0,
  },
]

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
