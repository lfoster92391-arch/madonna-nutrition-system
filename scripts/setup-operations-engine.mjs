import fs from "fs"
import path from "path"

const root = path.resolve(import.meta.dirname, "..")

function write(rel, content) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, "utf8")
  console.log("wrote", rel)
}

// Prisma schema patch - read and update if needed
const schemaPath = path.join(root, "prisma/schema.prisma")
let schema = fs.readFileSync(schemaPath, "utf8")

if (!schema.includes("model StorageLocation")) {
  schema = schema.replace(
    `  studentLunchSignups      StudentLunchSignup[]
}`,
    `  studentLunchSignups      StudentLunchSignup[]
  storageLocations         StorageLocation[]
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
  id                String             @id @default(cuid())
  name              String
  sku               String?
  qty               Int
  unit              String
  cost              Decimal            @db.Decimal(10, 2)
  expiration        DateTime
  category          String
  lowStockThreshold Int                @default(10)
  barcode           String?
  storageLocationId String?
  storageLocation   StorageLocation?   @relation(fields: [storageLocationId], references: [id], onDelete: SetNull)
  schoolId          String
  school            School             @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  movements         InventoryMovement[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

enum StorageLocationType {
  COOLER
  DRY
  FREEZER
}

model StorageLocation {
  id        String              @id @default(cuid())
  name      String
  type      StorageLocationType
  schoolId  String
  school    School              @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  items     InventoryItem[]
  createdAt DateTime            @default(now())
}

enum InventoryMovementType {
  RECEIVE
  USE
  WASTE
  ADJUST
}

model InventoryMovement {
  id        String                @id @default(cuid())
  itemId    String
  item      InventoryItem         @relation(fields: [itemId], references: [id], onDelete: Cascade)
  type      InventoryMovementType
  quantity  Int
  notes     String?
  createdAt DateTime              @default(now())
}

enum ReceivingStatus {
  PENDING
  RECEIVED
  APPROVED
}

model ReceivingRecord {
  id              String          @id @default(cuid())
  vendor          String
  status          ReceivingStatus @default(PENDING)
  items           Json            @default("[]")
  receiptImageUrl String?
  storageLocation String?
  receivedAt      DateTime?
  schoolId        String
  school          School          @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  receiptScans    ReceiptScan[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum ReceiptScanStatus {
  PENDING
  MATCHED
  APPROVED
}

model ReceiptScan {
  id                 String            @id @default(cuid())
  imageUrl           String
  ocrText            String?
  status             ReceiptScanStatus @default(PENDING)
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
  COMPLETE
}

model ProductionOrder {
  id               String                @id @default(cuid())
  date             DateTime              @db.Date
  mealTemplateId   String?
  mealTemplate     MealTemplate?         @relation(fields: [mealTemplateId], references: [id], onDelete: SetNull)
  status           ProductionOrderStatus @default(PLANNED)
  reservationCount Int                   @default(0)
  ingredients      Json                  @default("[]")
  schoolId         String
  school           School                @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  createdAt        DateTime              @default(now())
  updatedAt        DateTime              @updatedAt
}`
  )

  schema = schema.replace(
    `  calendarEvents    CalendarEvent[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model MealTemplateItem {`,
    `  calendarEvents    CalendarEvent[]
  productionOrders  ProductionOrder[]
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

model MealTemplateItem {`
  )

  fs.writeFileSync(schemaPath, schema, "utf8")
  console.log("updated prisma/schema.prisma")
}

console.log("Operations engine setup script complete. Run individual file writers next.")
