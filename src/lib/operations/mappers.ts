import type {
  InventoryItem as DbInventoryItem,
  InventoryMovement as DbInventoryMovement,
  ProductionOrder as DbProductionOrder,
  ReceiptScan as DbReceiptScan,
  ReceivingRecord as DbReceivingRecord,
  StorageLocation as DbStorageLocation,
} from "@prisma/client"
import type {
  InventoryMovement,
  OpsInventoryItem,
  ProductionOrder,
  ReceiptScan,
  ReceivingLine,
  ReceivingRecord,
  StorageLocation,
} from "@/lib/operations/types"

export function mapStorageLocation(row: DbStorageLocation): StorageLocation {
  return {
    id: row.id,
    name: row.name,
    zone: row.zone as StorageLocation["zone"],
    capacity: row.capacity ?? undefined,
    schoolId: row.schoolId,
  }
}

export function mapInventoryItem(row: DbInventoryItem): OpsInventoryItem {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? undefined,
    qty: row.qty,
    unit: row.unit,
    cost: Number(row.cost),
    expiration: row.expiration.toISOString().slice(0, 10),
    category: row.category,
    lowStockThreshold: row.lowStockThreshold,
    parLevel: row.lowStockThreshold,
    vendor: row.vendor ?? undefined,
    barcode: row.barcode ?? undefined,
    storageLocationId: row.storageLocationId ?? undefined,
    lastReceivedAt: row.lastReceivedAt?.toISOString(),
    schoolId: row.schoolId,
  }
}

export function mapMovement(row: DbInventoryMovement): InventoryMovement {
  return {
    id: row.id,
    type: row.type as InventoryMovement["type"],
    quantity: row.quantity,
    note: row.note ?? undefined,
    inventoryItemId: row.inventoryItemId,
    storageLocationId: row.storageLocationId ?? undefined,
    receivingRecordId: row.receivingRecordId ?? undefined,
    productionOrderId: row.productionOrderId ?? undefined,
    schoolId: row.schoolId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy ?? undefined,
  }
}

export function parseReceivingLines(lines: unknown): ReceivingLine[] {
  if (!Array.isArray(lines)) return []
  return lines as ReceivingLine[]
}

export function mapReceivingRecord(row: DbReceivingRecord): ReceivingRecord {
  return {
    id: row.id,
    vendorName: row.vendorName,
    invoiceNumber: row.invoiceNumber ?? undefined,
    status: row.status as ReceivingRecord["status"],
    notes: row.notes ?? undefined,
    lines: parseReceivingLines(row.lines),
    receivedAt: row.receivedAt?.toISOString(),
    approvedAt: row.approvedAt?.toISOString(),
    approvedBy: row.approvedBy ?? undefined,
    schoolId: row.schoolId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function mapReceiptScan(row: DbReceiptScan): ReceiptScan {
  return {
    id: row.id,
    fileName: row.fileName,
    imageUrl: row.imageUrl ?? undefined,
    vendorGuess: row.vendorGuess ?? undefined,
    status: row.status as ReceiptScan["status"],
    matchedReceivingId: row.matchedReceivingId ?? undefined,
    schoolId: row.schoolId,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapProductionOrder(row: DbProductionOrder): ProductionOrder {
  return {
    id: row.id,
    title: row.title,
    status: row.status as ProductionOrder["status"],
    scheduledFor: row.scheduledFor.toISOString(),
    portionsPlanned: row.portionsPlanned,
    portionsMade: row.portionsMade,
    mealTemplateId: row.mealTemplateId ?? undefined,
    notes: row.notes ?? undefined,
    schoolId: row.schoolId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
