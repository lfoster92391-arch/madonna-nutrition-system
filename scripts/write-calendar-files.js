const fs = require("fs")
const path = require("path")

function write(rel, content) {
  fs.mkdirSync(path.dirname(rel), { recursive: true })
  fs.writeFileSync(rel, content, "utf8")
  console.log("wrote", rel)
}

write(
  "src/app/(platform)/admin/calendar/page.tsx",
  `import { AdminCalendar } from "@/components/admin/calendar/AdminCalendar"

export default function AdminCalendarPage() {
  return <AdminCalendar />
}
`
)

write(
  "src/components/calendar/AdminCalendarDesigner.tsx",
  `"use client"

export { AdminCalendar as AdminCalendarDesigner } from "@/components/admin/calendar/AdminCalendar"
`
)

write(
  "src/components/admin/calendar/CalendarGrid.tsx",
  `"use client"

import { CalendarMonthGrid, CategoryLegend } from "@/components/calendar/CalendarMonthGrid"
import { ADMIN_LEGEND_CATEGORIES } from "@/lib/calendar"
import type { CalendarEvent } from "@/lib/types"

interface CalendarGridProps {
  year: number
  month: number
  events: CalendarEvent[]
  selectedDate: string | null
  onDayClick: (dateKey: string) => void
}

export function CalendarGrid({ year, month, events, selectedDate, onDayClick }: CalendarGridProps) {
  return (
    <div className="space-y-4">
      <CalendarMonthGrid
        year={year}
        month={month}
        events={events}
        accentHex="#041B52"
        selectedDate={selectedDate}
        onDayClick={onDayClick}
      />
      <CategoryLegend categories={ADMIN_LEGEND_CATEGORIES} />
    </div>
  )
}
`
)

write(
  "src/lib/operations/types.ts",
  `export type StorageZone = "dry" | "cold" | "freezer" | "prep"

export interface StorageLocation {
  id: string
  name: string
  zone: StorageZone
  capacity?: number
  schoolId: string
}

export interface OpsInventoryItem {
  id: string
  name: string
  sku?: string
  qty: number
  unit: string
  cost: number
  expiration: string
  category: string
  lowStockThreshold: number
  parLevel?: number
  vendor?: string
  barcode?: string
  storageLocationId?: string
  lastReceivedAt?: string
  schoolId: string
}

export type InventoryMovementType = "receive" | "adjust" | "transfer" | "production" | "waste"

export interface InventoryMovement {
  id: string
  type: InventoryMovementType
  quantity: number
  note?: string
  inventoryItemId: string
  storageLocationId?: string
  receivingRecordId?: string
  productionOrderId?: string
  schoolId: string
  createdAt: string
  createdBy?: string
}

export interface ReceivingLine {
  inventoryItemId?: string
  name: string
  quantity: number
  unit: string
  unitCost?: number
}

export type ReceivingStatus = "draft" | "pending_approval" | "approved" | "rejected"

export interface ReceivingRecord {
  id: string
  vendorName: string
  invoiceNumber?: string
  status: ReceivingStatus
  notes?: string
  lines: ReceivingLine[]
  receivedAt?: string
  approvedAt?: string
  approvedBy?: string
  schoolId: string
  createdAt: string
  updatedAt: string
}

export type ReceiptScanStatus = "pending" | "unmatched" | "matched"

export interface ReceiptScan {
  id: string
  fileName: string
  imageUrl?: string
  vendorGuess?: string
  status: ReceiptScanStatus
  matchedReceivingId?: string
  schoolId: string
  createdAt: string
}

export type ProductionOrderStatus = "planned" | "in_progress" | "completed" | "cancelled"

export interface ProductionOrder {
  id: string
  title: string
  status: ProductionOrderStatus
  scheduledFor: string
  portionsPlanned: number
  portionsMade: number
  mealTemplateId?: string
  notes?: string
  schoolId: string
  createdAt: string
  updatedAt: string
}
`
)

console.log("done")
