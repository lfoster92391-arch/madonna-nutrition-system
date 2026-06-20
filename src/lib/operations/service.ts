import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isDatabaseEnabled } from "@/lib/db/config"
import { resolveSchoolId } from "@/lib/db/school"
import {
  mapInventoryItem,
  mapMovement,
  mapProductionOrder,
  mapReceiptScan,
  mapReceivingRecord,
  mapStorageLocation,
  parseReceivingLines,
} from "@/lib/operations/mappers"
import type {
  InventoryMovement,
  InventoryMovementType,
  OpsInventoryItem,
  ProductionOrder,
  ProductionOrderStatus,
  ReceiptScan,
  ReceivingLine,
  ReceivingRecord,
  ReceivingStatus,
  StorageLocation,
} from "@/lib/operations/types"

export interface OperationsSnapshot {
  source: "database"
  storageLocations: StorageLocation[]
  inventory: OpsInventoryItem[]
  movements: InventoryMovement[]
  receiving: ReceivingRecord[]
  receipts: ReceiptScan[]
  production: ProductionOrder[]
}

function emptySnapshot(): OperationsSnapshot {
  return {
    source: "database",
    storageLocations: [],
    inventory: [],
    movements: [],
    receiving: [],
    receipts: [],
    production: [],
  }
}

function requireDatabase() {
  if (!isDatabaseEnabled()) {
    throw new Error("Database is not configured. Set DATABASE_URL to enable operations.")
  }
}

export async function getOperationsSnapshot(): Promise<OperationsSnapshot> {
  if (!isDatabaseEnabled()) {
    return {
      source: "database",
      storageLocations: [],
      inventory: [],
      movements: [],
      receiving: [],
      receipts: [],
      production: [],
    }
  }

  try {
    const schoolId = await resolveSchoolId()
    const [storageLocations, inventory, movements, receiving, receipts, production] =
      await Promise.all([
        prisma.storageLocation.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
        prisma.inventoryItem.findMany({ where: { schoolId }, orderBy: { name: "asc" } }),
        prisma.inventoryMovement.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.receivingRecord.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.receiptScan.findMany({
          where: { schoolId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.productionOrder.findMany({
          where: { schoolId },
          orderBy: { scheduledFor: "asc" },
        }),
      ])

    return {
      source: "database",
      storageLocations: storageLocations.map(mapStorageLocation),
      inventory: inventory.map(mapInventoryItem),
      movements: movements.map(mapMovement),
      receiving: receiving.map(mapReceivingRecord),
      receipts: receipts.map(mapReceiptScan),
      production: production.map(mapProductionOrder),
    }
  } catch (error) {
    console.error("getOperationsSnapshot failed:", error)
    return emptySnapshot()
  }
}

export async function getInventoryData() {
  const snap = await getOperationsSnapshot()
  return {
    source: snap.source,
    items: snap.inventory,
    movements: snap.movements,
    storageLocations: snap.storageLocations,
  }
}

export async function getReceivingData() {
  const snap = await getOperationsSnapshot()
  return {
    source: snap.source,
    records: snap.receiving,
    storageLocations: snap.storageLocations,
    inventory: snap.inventory,
  }
}

export async function getProductionData() {
  const snap = await getOperationsSnapshot()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayOrders = snap.production.filter((o) => {
    const d = new Date(o.scheduledFor)
    return d >= today && d < tomorrow
  })

  return {
    source: snap.source,
    orders: snap.production,
    todayOrders,
  }
}

export async function getReceiptsData() {
  const snap = await getOperationsSnapshot()
  return {
    source: snap.source,
    scans: snap.receipts,
    receiving: snap.receiving.filter((r) => r.status !== "rejected"),
  }
}

export async function createReceivingRecord(input: {
  vendorName: string
  invoiceNumber?: string
  lines: ReceivingLine[]
  notes?: string
  storageLocationId?: string
  status?: ReceivingStatus
  barcode?: string
}) {
  const status = input.status ?? "pending_approval"
  const now = new Date().toISOString()

  let lines = [...input.lines]
  if (input.barcode) {
    const snap = await getOperationsSnapshot()
    const match = snap.inventory.find((i) => i.barcode === input.barcode)
    if (match) {
      lines = [
        {
          inventoryItemId: match.id,
          name: match.name,
          quantity: 1,
          unit: match.unit,
        },
        ...lines,
      ]
    }
  }

  requireDatabase()

  const schoolId = await resolveSchoolId()
  const row = await prisma.receivingRecord.create({
    data: {
      vendorName: input.vendorName,
      invoiceNumber: input.invoiceNumber,
      status,
      notes: input.notes,
      lines: lines as unknown as Prisma.InputJsonValue,
      receivedAt: status !== "draft" ? new Date() : null,
      schoolId,
    },
  })
  return { source: "database" as const, record: mapReceivingRecord(row) }
}

export async function updateReceivingRecord(
  id: string,
  action: "approve" | "reject" | "submit",
  approvedBy?: string,
  storageLocationId?: string
) {
  requireDatabase()

  const schoolId = await resolveSchoolId()
  const existing = await prisma.receivingRecord.findFirst({ where: { id, schoolId } })
  if (!existing) throw new Error("Receiving record not found")

  if (action === "approve") {
    const lines = parseReceivingLines(existing.lines)
    await prisma.$transaction(async (tx) => {
      await tx.receivingRecord.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: approvedBy ?? "Admin",
        },
      })

      for (const line of lines) {
        const existingItem = line.inventoryItemId
          ? await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } })
          : await tx.inventoryItem.findFirst({
              where: { schoolId, name: { equals: line.name, mode: "insensitive" } },
            })

        if (existingItem) {
          await tx.inventoryItem.update({
            where: { id: existingItem.id },
            data: {
              qty: existingItem.qty + line.quantity,
              lastReceivedAt: new Date(),
              ...(storageLocationId ? { storageLocationId } : {}),
            },
          })
          await tx.inventoryMovement.create({
            data: {
              type: "receive",
              quantity: line.quantity,
              note: `Received via ${id}`,
              inventoryItemId: existingItem.id,
              storageLocationId,
              receivingRecordId: id,
              schoolId,
              createdBy: approvedBy ?? "Receiving",
            },
          })
        } else {
          const created = await tx.inventoryItem.create({
            data: {
              name: line.name,
              qty: line.quantity,
              unit: line.unit,
              cost: line.unitCost ?? 0,
              expiration: new Date(Date.now() + 30 * 86400000),
              category: "General",
              storageLocationId,
              lastReceivedAt: new Date(),
              schoolId,
            },
          })
          await tx.inventoryMovement.create({
            data: {
              type: "receive",
              quantity: line.quantity,
              note: `New item from ${id}`,
              inventoryItemId: created.id,
              storageLocationId,
              receivingRecordId: id,
              schoolId,
              createdBy: approvedBy ?? "Receiving",
            },
          })
        }
      }
    })
  } else {
    await prisma.receivingRecord.update({
      where: { id },
      data: {
        status: action === "reject" ? "rejected" : "pending_approval",
        receivedAt: action === "submit" ? new Date() : undefined,
      },
    })
  }

  const updated = await prisma.receivingRecord.findUniqueOrThrow({ where: { id } })
  return { source: "database" as const, record: mapReceivingRecord(updated) }
}

export async function recordInventoryMovement(input: {
  inventoryItemId: string
  type: InventoryMovementType
  quantity: number
  note?: string
  createdBy?: string
}) {
  const qtyDelta = input.type === "waste" || input.type === "production" ? -Math.abs(input.quantity) : input.quantity

  requireDatabase()

  const schoolId = await resolveSchoolId()
  const item = await prisma.inventoryItem.findFirst({
    where: { id: input.inventoryItemId, schoolId },
  })
  if (!item) throw new Error("Inventory item not found")

  const [movement, updated] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        type: input.type,
        quantity: qtyDelta,
        note: input.note,
        inventoryItemId: item.id,
        storageLocationId: item.storageLocationId,
        schoolId,
        createdBy: input.createdBy ?? "Kitchen",
      },
    }),
    prisma.inventoryItem.update({
      where: { id: item.id },
      data: { qty: Math.max(0, item.qty + qtyDelta) },
    }),
  ])

  return {
    source: "database" as const,
    movement: mapMovement(movement),
    item: mapInventoryItem(updated),
  }
}

export async function updateProductionOrder(
  id: string,
  updates: {
    status?: ProductionOrderStatus
    portionsMade?: number
    wasteNote?: string
    wasteQuantity?: number
    wasteItemId?: string
  }
) {
  requireDatabase()

  const schoolId = await resolveSchoolId()
  const data: Prisma.ProductionOrderUpdateInput = {}
  if (updates.status) data.status = updates.status
  if (updates.portionsMade !== undefined) data.portionsMade = updates.portionsMade

  if (updates.wasteItemId && updates.wasteQuantity) {
    await recordInventoryMovement({
      inventoryItemId: updates.wasteItemId,
      type: "waste",
      quantity: updates.wasteQuantity,
      note: updates.wasteNote ?? "Production waste",
      createdBy: "Production",
    })
    const existing = await prisma.productionOrder.findFirst({ where: { id, schoolId } })
    const wasteLog = Array.isArray(existing?.wasteLog) ? [...(existing!.wasteLog as unknown[])] : []
    wasteLog.push({
      itemId: updates.wasteItemId,
      quantity: updates.wasteQuantity,
      note: updates.wasteNote,
      at: new Date().toISOString(),
    })
    data.wasteLog = wasteLog as Prisma.InputJsonValue
  }

  const row = await prisma.productionOrder.update({ where: { id }, data })
  return { source: "database" as const, order: mapProductionOrder(row) }
}

export async function createReceiptScan(input: { fileName: string; imageUrl?: string }) {
  const vendorGuess = input.fileName.toLowerCase().includes("sysco")
    ? "Sysco Foods"
    : input.fileName.toLowerCase().includes("produce")
      ? "Local Produce Co."
      : undefined
  const ocrText = `[OCR Stub] Parsed ${input.fileName}\nVendor: ${vendorGuess ?? "Unknown"}\nTotal: $---\nLine items pending review`

  requireDatabase()

  const schoolId = await resolveSchoolId()
  const row = await prisma.receiptScan.create({
    data: {
      fileName: input.fileName,
      imageUrl: input.imageUrl,
      vendorGuess,
      ocrText,
      status: vendorGuess ? "unmatched" : "pending",
      schoolId,
    },
  })
  return { source: "database" as const, scan: mapReceiptScan(row), ocrText }
}

export async function matchReceiptScan(id: string, receivingId: string, approve = false) {
  requireDatabase()

  const schoolId = await resolveSchoolId()
  const row = await prisma.receiptScan.update({
    where: { id },
    data: { status: "matched", matchedReceivingId: receivingId },
  })
  if (approve) {
    await updateReceivingRecord(receivingId, "approve", "Receipt Center")
  }
  return { source: "database" as const, scan: mapReceiptScan(row) }
}

export async function lookupBarcode(barcode: string) {
  const snap = await getOperationsSnapshot()
  return snap.inventory.find((i) => i.barcode === barcode) ?? null
}
