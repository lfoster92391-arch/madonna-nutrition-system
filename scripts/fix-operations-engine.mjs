import fs from "fs"
import path from "path"

const root = path.resolve(import.meta.dirname, "..")

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, "utf8")
  console.log("wrote", rel)
}

write("src/lib/operations/types.ts", `export type StorageZone = "dry" | "cold" | "freezer" | "prep"

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

export type InventoryMovementType =
  | "receive"
  | "adjust"
  | "transfer"
  | "production"
  | "waste"

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

export type ReceivingStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"

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

export type ProductionOrderStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled"

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
`)

write("src/lib/db/operations-mappers.ts", `import type {
  InventoryMovement,
  InventoryMovementType,
  OpsInventoryItem,
  ProductionOrder,
  ProductionOrderStatus,
  ReceiptScan,
  ReceiptScanStatus,
  ReceivingRecord,
  ReceivingStatus,
  StorageLocation,
  StorageZone,
} from "@/lib/operations/types"
import type {
  InventoryItem as DbInventoryItem,
  InventoryMovement as DbInventoryMovement,
  InventoryMovementType as DbMovementType,
  ProductionOrder as DbProductionOrder,
  ProductionOrderStatus as DbProductionStatus,
  ReceiptScan as DbReceiptScan,
  ReceiptScanStatus as DbReceiptStatus,
  ReceivingRecord as DbReceivingRecord,
  ReceivingStatus as DbReceivingStatus,
  StorageLocation as DbStorageLocation,
  StorageZone as DbStorageZone,
} from "@prisma/client"

function toIso(d: Date | null | undefined): string | undefined {
  return d ? d.toISOString() : undefined
}

function mapZone(z: DbStorageZone): StorageZone {
  return z === "COLD" ? "cold" : z === "FREEZER" ? "freezer" : z === "PREP" ? "prep" : "dry"
}

function mapMovementType(t: DbMovementType): InventoryMovementType {
  const map: Record<DbMovementType, InventoryMovementType> = {
    RECEIVE: "receive",
    ADJUST: "adjust",
    TRANSFER: "transfer",
    PRODUCTION: "production",
    WASTE: "waste",
  }
  return map[t]
}

function mapReceivingStatus(s: DbReceivingStatus): ReceivingStatus {
  const map: Record<DbReceivingStatus, ReceivingStatus> = {
    DRAFT: "draft",
    PENDING_APPROVAL: "pending_approval",
    APPROVED: "approved",
    REJECTED: "rejected",
  }
  return map[s]
}

function mapReceiptStatus(s: DbReceiptStatus): ReceiptScanStatus {
  const map: Record<DbReceiptStatus, ReceiptScanStatus> = {
    PENDING: "pending",
    UNMATCHED: "unmatched",
    MATCHED: "matched",
  }
  return map[s]
}

function mapProductionStatus(s: DbProductionStatus): ProductionOrderStatus {
  const map: Record<DbProductionStatus, ProductionOrderStatus> = {
    PLANNED: "planned",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  }
  return map[s]
}

export function mapStorageLocation(row: DbStorageLocation): StorageLocation {
  return {
    id: row.id,
    name: row.name,
    zone: mapZone(row.zone),
    capacity: row.capacity ?? undefined,
    schoolId: row.schoolId,
  }
}

export function mapOpsInventoryItem(row: DbInventoryItem): OpsInventoryItem {
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
    parLevel: row.parLevel ?? undefined,
    vendor: row.vendor ?? undefined,
    barcode: row.barcode ?? undefined,
    storageLocationId: row.storageLocationId ?? undefined,
    lastReceivedAt: toIso(row.lastReceivedAt),
    schoolId: row.schoolId,
  }
}

export function mapInventoryMovement(row: DbInventoryMovement): InventoryMovement {
  return {
    id: row.id,
    type: mapMovementType(row.type),
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

export function mapReceivingRecord(row: DbReceivingRecord): ReceivingRecord {
  const lines = Array.isArray(row.lines) ? (row.lines as ReceivingRecord["lines"]) : []
  return {
    id: row.id,
    vendorName: row.vendorName,
    invoiceNumber: row.invoiceNumber ?? undefined,
    status: mapReceivingStatus(row.status),
    notes: row.notes ?? undefined,
    lines,
    receivedAt: toIso(row.receivedAt),
    approvedAt: toIso(row.approvedAt),
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
    status: mapReceiptStatus(row.status),
    matchedReceivingId: row.matchedReceivingId ?? undefined,
    schoolId: row.schoolId,
    createdAt: row.createdAt.toISOString(),
  }
}

export function mapProductionOrder(row: DbProductionOrder): ProductionOrder {
  return {
    id: row.id,
    title: row.title,
    status: mapProductionStatus(row.status),
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
`)

// Patch prisma schema
const schemaPath = path.join(root, "prisma/schema.prisma")
let schema = fs.readFileSync(schemaPath, "utf8")

if (!schema.includes("model StorageLocation")) {
  schema = schema.replace(
    /  onboardingPricing        OnboardingPricing\?\n\}/,
    `  onboardingPricing        OnboardingPricing?
  storageLocations         StorageLocation[]
  inventoryMovements       InventoryMovement[]
  receivingRecords         ReceivingRecord[]
  receiptScans             ReceiptScan[]
  productionOrders         ProductionOrder[]
}`
  )

  schema = schema.replace(
    `model InventoryItem {
  id                String   @id @default(cuid())
  name              String
  qty               Int
  unit              String
  cost              Decimal  @db.Decimal(10, 2)
  expiration        DateTime
  category          String
  lowStockThreshold Int      @default(10)
  barcode           String?
  schoolId          String
  school            School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}`,
    `model InventoryItem {
  id                String              @id @default(cuid())
  name              String
  sku               String?
  qty               Int
  unit              String
  cost              Decimal             @db.Decimal(10, 2)
  expiration        DateTime
  category          String
  lowStockThreshold Int                 @default(10)
  parLevel          Int?
  vendor            String?
  barcode           String?
  storageLocationId String?
  storageLocation   StorageLocation?    @relation(fields: [storageLocationId], references: [id], onDelete: SetNull)
  lastReceivedAt    DateTime?
  schoolId          String
  school            School              @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  movements         InventoryMovement[]
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
}

enum StorageZone {
  DRY
  COLD
  FREEZER
  PREP
}

model StorageLocation {
  id        String              @id @default(cuid())
  name      String
  zone      StorageZone         @default(DRY)
  capacity  Int?
  schoolId  String
  school    School              @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  items     InventoryItem[]
  movements InventoryMovement[]
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt
}

enum InventoryMovementType {
  RECEIVE
  ADJUST
  TRANSFER
  PRODUCTION
  WASTE
}

model InventoryMovement {
  id                String                @id @default(cuid())
  type              InventoryMovementType
  quantity          Int
  note              String?
  inventoryItemId   String
  inventoryItem     InventoryItem         @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  storageLocationId String?
  storageLocation   StorageLocation?      @relation(fields: [storageLocationId], references: [id], onDelete: SetNull)
  receivingRecordId String?
  receivingRecord   ReceivingRecord?      @relation(fields: [receivingRecordId], references: [id], onDelete: SetNull)
  productionOrderId String?
  productionOrder   ProductionOrder?      @relation(fields: [productionOrderId], references: [id], onDelete: SetNull)
  schoolId          String
  school            School                @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdBy         String?
  createdAt         DateTime              @default(now())
}

enum ReceivingStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

model ReceivingRecord {
  id            String            @id @default(cuid())
  vendorName    String
  invoiceNumber String?
  status        ReceivingStatus   @default(PENDING_APPROVAL)
  notes         String?
  lines         Json              @default("[]")
  receivedAt    DateTime?
  approvedAt    DateTime?
  approvedBy    String?
  schoolId      String
  school        School            @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  movements     InventoryMovement[]
  receiptScans  ReceiptScan[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

enum ReceiptScanStatus {
  PENDING
  UNMATCHED
  MATCHED
}

model ReceiptScan {
  id                 String            @id @default(cuid())
  fileName           String
  imageUrl           String?
  vendorGuess        String?
  status             ReceiptScanStatus @default(UNMATCHED)
  matchedReceivingId String?
  matchedReceiving   ReceivingRecord?  @relation(fields: [matchedReceivingId], references: [id], onDelete: SetNull)
  schoolId           String
  school             School            @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
}

enum ProductionOrderStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ProductionOrder {
  id              String                @id @default(cuid())
  title           String
  status          ProductionOrderStatus @default(PLANNED)
  scheduledFor    DateTime
  portionsPlanned Int                   @default(0)
  portionsMade    Int                   @default(0)
  mealTemplateId  String?
  mealTemplate    MealTemplate?         @relation(fields: [mealTemplateId], references: [id], onDelete: SetNull)
  notes           String?
  schoolId        String
  school          School                @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  movements       InventoryMovement[]
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
}`
  )

  if (!schema.includes("productionOrders  ProductionOrder[]")) {
    schema = schema.replace(
      /  calendarEvents    CalendarEvent\[\]\n  createdAt/,
      `  calendarEvents    CalendarEvent[]
  productionOrders  ProductionOrder[]
  createdAt`
    )
  }

  fs.writeFileSync(schemaPath, schema, "utf8")
  console.log("updated prisma/schema.prisma")
}

console.log("done")
