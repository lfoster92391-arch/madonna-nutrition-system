import { z } from "zod"
import { isWeekendDateKey, WEEKEND_MENU_DAY_MESSAGE } from "@/lib/calendar"
import {
  asTrimmedString,
  importBadgeStatusDefaultActive,
  importMoney,
  importOptionalBadgeStatus,
  importOptionalEmail,
  importOptionalString,
  importRequiredString,
  importString,
} from "@/lib/import-export/coerce"

export const allergySchema = z.object({
  name: z.string().min(1),
  severity: z.enum(["severe", "moderate", "informational"]),
})

export const parentContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
  relationship: z.string().optional(),
})

export const studentSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  grade: z.string().min(1),
  homeroom: z.string().optional(),
  balance: z.number(),
  photo: z.string().optional(),
  barcode: z.string().optional(),
  badgeStatus: z.enum(["active", "pending", "inactive"]).optional(),
  allergies: z.array(allergySchema).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  parentContacts: z.array(parentContactSchema).optional(),
  disabled: z.boolean().optional(),
})

export const studentUpdateSchema = studentSchema.partial().omit({ id: true })

export const mealTransactionSchema = z.object({
  studentId: z.string().min(1),
  meal: z.string().min(1),
  amount: z.number().nonnegative(),
  /** Stable button key (e.g. student_meal) — used so renamed system meals still get lunch pricing. */
  mealType: z.string().min(1).optional(),
  processedByUserId: z.string().min(1).optional(),
})

export const staffMealTransactionSchema = z.object({
  userId: z.string().min(1),
  meal: z.string().min(1),
  amount: z.number().nonnegative(),
  mealType: z.string().min(1).optional(),
  processedByUserId: z.string().min(1).optional(),
})

export const officeDepositSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().positive().max(2000),
  method: z.enum(["cash", "check", "card", "other"]).default("cash"),
  note: z.string().max(500).optional(),
  action: z.enum(["add", "subtract"]).default("add"),
})

export const staffDepositSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive().max(2000),
  method: z.enum(["cash", "check", "card", "other"]).default("cash"),
  note: z.string().max(500).optional(),
  action: z.enum(["add", "subtract"]).default("add"),
})

export const parentRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(40).optional(),
  /** Prefer array; single id kept for compatibility. */
  studentExternalId: z.string().min(1).optional(),
  studentExternalIds: z.array(z.string().min(1)).max(10).optional(),
  relationship: z.string().min(1).max(60).default("Guardian"),
}).superRefine((val, ctx) => {
  const ids = [
    ...(val.studentExternalIds ?? []),
    ...(val.studentExternalId ? [val.studentExternalId] : []),
  ]
  if (ids.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Link at least one student",
      path: ["studentExternalIds"],
    })
  }
})

export const parentLinkStudentSchema = z.object({
  studentExternalId: z.string().min(1),
  relationship: z.string().min(1).max(60).default("Guardian"),
})

export const parentStudentSearchSchema = z.object({
  q: z.string().min(2).max(80),
})

export const workplaceRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(40).optional(),
  department: z.string().max(80).optional(),
})

export const queuedTransactionSchema = z.object({
  clientTxId: z.string().uuid(),
  studentId: z.string().min(1),
  mealType: z.string().min(1),
  amount: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  processedByName: z.string().min(1),
  deviceId: z.string().optional(),
})

export const syncBatchSchema = z.object({
  transactions: z.array(queuedTransactionSchema).min(1).max(500),
})

export const badgeIdSchema = z
  .string()
  .regex(/^\d{4,6}$/, "Badge ID must be 4–6 digits")
  .optional()
  .nullable()

export const userRoleSchema = z.enum([
  "admin",
  "cashier",
  "parent",
  "staff",
  "teacher",
  "student",
])

export const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: userRoleSchema,
  phone: z.string().optional(),
  badgeId: badgeIdSchema,
  linkedStudentIds: z.array(z.string()).optional(),
  performedBy: z.string().optional(),
})

export const adminUserBaseSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
})

export const adminCreateUserSchema = createUserSchema.extend({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  password: z.string().min(8).optional(),
  generateTempPassword: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
})

export const adminResetPasswordSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  password: z.string().min(8).optional(),
  generateTempPassword: z.boolean().optional(),
  forcePasswordChange: z.boolean().optional(),
  reason: z.string().optional(),
})

export const changePasswordSchema = z.object({
  userId: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: userRoleSchema.optional(),
  phone: z.string().optional(),
  badgeId: badgeIdSchema,
  department: z.string().optional(),
  photo: z.string().optional(),
  linkedStudentIds: z.array(z.string()).optional(),
  performedBy: z.string().optional(),
  reason: z.string().optional(),
})

export const userPhotoUploadSchema = z.object({
  photo: z.string().min(1).max(2_500_000),
})

export const userActionSchema = z.object({
  performedBy: z.string().min(1),
  reason: z.string().optional(),
})

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
  adminUserId: z.string().min(1),
  performedBy: z.string().optional(),
  reason: z.string().optional(),
})

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string(),
  role: z.enum(["admin", "cashier", "parent", "staff", "teacher", "student"]),
})

export const calendarEventSchema = z
  .object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string().optional(),
    category: z.enum([
      "menu_day",
      "holiday",
      "early_dismissal",
      "special_event",
      "no_school",
      "teacher_meal",
    ]),
    color: z.string().optional(),
    mealTemplateId: z.string().optional(),
    publishStatus: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // School lunch menus are Mon–Fri only; holidays/no_school may still use weekends.
    if (
      data.category === "menu_day" &&
      data.date &&
      isWeekendDateKey(data.date)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: WEEKEND_MENU_DAY_MESSAGE,
        path: ["date"],
      })
    }
  })

const mealPhotoSlotSchema = z.enum(["entree", "side", "dessert", "drink", "additional"])
const mealCategorySchema = z.enum([
  "breakfast",
  "lunch",
  "recipe",
  "dessert",
  "side",
  "drink",
  "special_event",
  "holiday",
  "seasonal",
  "archived",
])
const gradeAvailabilitySchema = z.enum(["grades_7_8", "grades_9_12", "teacher", "staff"])

export const mealTemplateItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
})

export const mealPhotoSchema = z.object({
  id: z.string().optional(),
  slot: mealPhotoSlotSchema,
  url: z.string().min(1),
})

export const mealTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: mealCategorySchema,
  mealType: z.enum(["breakfast", "lunch", "special"]),
  allergens: z.array(z.string()).optional(),
  nutritionNotes: z.string().optional(),
  portionNotes: z.string().optional(),
  gradeAvailability: z.array(gradeAvailabilitySchema).optional(),
  ingredients: z.array(z.string()).optional(),
  isReusable: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  studentMealPrice: z.number().nonnegative().optional(),
  alaCartePrice: z.number().nonnegative().optional(),
  staffMealPrice: z.number().nonnegative().optional(),
  items: z.array(mealTemplateItemSchema).optional(),
  photos: z.array(mealPhotoSchema).optional(),
})

export const calendarSettingsSchema = z.object({
  headerTitle: z.string().min(1),
  bannerMessage: z.string().optional(),
  accentColor: z.enum(["navy", "green", "amber"]),
  schoolName: z.string().min(1),
})

export const foodSafetyPayloadSchema = z.object({
  allergies: z.array(z.string()),
  otherAllergyDescription: z.string().optional(),
  severity: z.enum(["severe", "moderate", "informational"]),
  reactionInfo: z.string().optional(),
  medicalNotes: z.string().optional(),
  crossContact: z.object({
    avoidSharedEquipment: z.boolean(),
    traceAmountsTrigger: z.boolean(),
    ingredientOnly: z.boolean(),
  }),
  dietaryRestrictions: z.array(z.string()),
  otherDietaryDescription: z.string().optional(),
  emergencyMealNotes: z.string().optional(),
  emergencyFoodContactName: z.string().optional(),
  emergencyFoodContactPhone: z.string().optional(),
  consentConfirmed: z.boolean(),
  electronicSignature: z.string(),
  signatureDate: z.string(),
})

export const allergySubmissionSchema = z.object({
  studentId: z.string().min(1),
  submittedBy: z.string().min(1),
  payload: foodSafetyPayloadSchema,
})

export const reviewSubmissionSchema = z.object({
  action: z.enum(["approve", "reject", "clarification"]),
  reviewedBy: z.string().min(1),
  reviewNote: z.string().optional(),
})

export const medicalDocumentSchema = z.object({
  studentId: z.string().min(1),
  fileName: z.string().min(1),
  documentUrl: z.string().min(1),
  uploadedBy: z.string().min(1),
})

export const parentContactUpdateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string(),
})

export const receivingLineSchema = z.object({
  inventoryItemId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  unitCost: z.number().nonnegative().optional(),
  totalCost: z.number().nonnegative().optional(),
})

export const createReceivingSchema = z.object({
  vendorName: z.string().min(1),
  invoiceNumber: z.string().optional(),
  lines: z.array(receivingLineSchema).min(1),
  notes: z.string().optional(),
  storageLocationId: z.string().optional(),
  status: z.enum(["draft", "pending_approval"]).optional(),
  barcode: z.string().optional(),
})

export const updateReceivingSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject", "submit"]),
  approvedBy: z.string().optional(),
  storageLocationId: z.string().optional(),
})

export const inventoryMovementSchema = z.object({
  inventoryItemId: z.string().min(1),
  type: z.enum(["receive", "adjust", "transfer", "production", "waste", "usage"]),
  quantity: z.number().positive(),
  note: z.string().optional(),
  createdBy: z.string().optional(),
  loggedAt: z.string().optional(),
})

/** Simple grocery purchase for cafeteria operators (posts stock immediately). */
export const groceryPurchaseSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  /** Total amount paid for this purchase (not per-unit). */
  totalCost: z.number().nonnegative(),
  vendor: z.string().optional(),
  purchasedAt: z.string().optional(),
  notes: z.string().optional(),
})

export const updateProductionSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
  portionsMade: z.number().nonnegative().optional(),
  wasteItemId: z.string().optional(),
  wasteQuantity: z.number().positive().optional(),
  wasteNote: z.string().optional(),
})

export const createReceiptSchema = z.object({
  fileName: z.string().min(1),
  imageUrl: z.string().optional(),
})

export const matchReceiptSchema = z.object({
  id: z.string().min(1),
  receivingId: z.string().min(1),
  approve: z.boolean().optional(),
})

export const familyImportRowSchema = z.object({
  parentEmail: z.string().email(),
  parentFirstName: z.string().min(1),
  parentLastName: z.string().min(1),
  parentPhone: z.string().optional(),
  parentUsername: z.string().optional(),
  studentMdId: z.string().min(1),
  studentFirstName: z.string().optional(),
  studentLastName: z.string().optional(),
  grade: z.string().optional(),
  balance: z.coerce.number().optional(),
  relationship: z.string().optional(),
  password: z.string().optional(),
  sendWelcomeEmail: z.union([z.boolean(), z.string()]).optional(),
})

export const familyImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  rows: z.array(familyImportRowSchema).min(1).max(500),
})

const STAFF_IMPORT_ROLE_ALIASES: Record<string, "admin" | "cashier" | "staff" | "teacher"> = {
  admin: "admin",
  administrator: "admin",
  cashier: "cashier",
  staff: "staff",
  teacher: "teacher",
  faculty: "teacher",
}

export const staffImportRoleSchema = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val
    const normalized = val.trim().toLowerCase().replace(/[\s-]+/g, "")
    return STAFF_IMPORT_ROLE_ALIASES[normalized] ?? normalized
  },
  z.enum(["admin", "cashier", "staff", "teacher"], {
    message: "Role must be admin, cashier, staff, or teacher",
  })
)

export const staffImportRowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: staffImportRoleSchema,
  department: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  badgeId: z.string().optional(),
  password: z.string().optional(),
})

export const staffImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  // Empty string from the client means "not set" — do not treat as a short password.
  defaultPassword: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(8, "Default bulk password must be at least 8 characters").optional()
  ),
  rows: z.array(staffImportRowSchema).min(1).max(500),
})

/** Bulk student portal logins — match roster by MD ID; optional email/password per row. */
export const studentPortalImportRowSchema = z
  .object({
    mdId: importOptionalString,
    externalId: importOptionalString,
    email: importOptionalEmail,
    password: importOptionalString,
  })
  .superRefine((row, ctx) => {
    const mdId = (row.mdId || row.externalId || "").trim()
    if (!mdId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mdId (or externalId) is required",
        path: ["mdId"],
      })
    }
  })

export const studentPortalImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  defaultPassword: z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
    z.string().trim().min(8, "Default bulk password must be at least 8 characters").optional()
  ),
  rows: z.array(studentPortalImportRowSchema).min(1).max(1000),
})

export const badgeStatusSchema = importBadgeStatusDefaultActive
export const optionalBadgeStatusSchema = importOptionalBadgeStatus

export const badgeAssignSchema = z.object({
  barcode: z.string().min(1).optional().nullable(),
  badgeStatus: optionalBadgeStatusSchema,
  photo: z.string().optional(),
})

/** Loose row shape — incomplete name/grade handled per-row via createIncompleteStubs. */
export const badgeImportRowSchema = z.object({
  mdId: importRequiredString,
  firstName: importString,
  lastName: importString,
  grade: importString,
  photoUrl: importOptionalString,
  badgeStatus: optionalBadgeStatusSchema,
  barcode: importOptionalString,
})

export const badgeImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  /** Raw rows — validated per-row so incomplete stubs can still import. */
  rows: z.array(z.unknown()).min(1).max(1000),
  createIncompleteStubs: z.boolean().optional(),
})

/**
 * Student SIS / directory import row.
 * Identity: mdId OR email (mdId auto-allocated when missing), plus first/last
 * (or combined studentName as "Last, First").
 * Grade is derived from school email class-year suffix when present.
 */
export const studentImportRowSchema = z
  .object({
    mdId: importOptionalString,
    firstName: importOptionalString,
    lastName: importOptionalString,
    /** Combined directory name e.g. "Arthurs, Thomas". */
    studentName: importOptionalString,
    /** Student school email — drives grade-from-email when *@weirtonmadonna.org. */
    email: importOptionalEmail,
    grade: z.preprocess((val) => {
      const s = asTrimmedString(val)
      return s === "" ? "" : s
    }, z.string()),
    homeroom: importOptionalString,
    /** When omitted/blank on update, existing balance is preserved; creates default to 0. */
    balance: importMoney,
    /** Maps to Student.badgeStatus; empty → active. Also accepts active/isActive aliases via wizard. */
    badgeStatus: importBadgeStatusDefaultActive,
    photo: importOptionalString,
    photoUrl: importOptionalString,
    parent: importOptionalString,
    parentName: importOptionalString,
    parentEmail: importOptionalEmail,
    parentPhone: importOptionalString,
    allergies: importOptionalString,
    dietaryRestrictions: importOptionalString,
  })
  .superRefine((row, ctx) => {
    const hasNames =
      (Boolean(row.firstName?.trim()) && Boolean(row.lastName?.trim())) ||
      Boolean(row.studentName?.trim())
    if (!hasNames) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "firstName+lastName or studentName is required",
        path: ["firstName"],
      })
    }
    if (!row.mdId?.trim() && !row.email?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mdId or email is required",
        path: ["mdId"],
      })
    }
  })

export const studentImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  performedBy: z.string().min(1),
  /** Raw rows — validated per-row so one bad optional field does not reject the batch. */
  rows: z.array(z.unknown()).min(1).max(1000),
  updateExisting: z.boolean().optional(),
})

export const vendorSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  category: z.string().optional(),
  active: z.boolean().optional(),
})

export const vendorImportRowSchema = vendorSchema.extend({
  name: z.string().min(1),
})

export const vendorImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  rows: z.array(vendorImportRowSchema).min(1).max(500),
})

export const parentImportRowSchema = z.object({
  parentEmail: z.preprocess(
    (val) =>
      typeof val === "string" ? val.trim().toLowerCase() : String(val ?? "").trim().toLowerCase(),
    z.string().email()
  ),
  parentName: importRequiredString,
  parentPhone: importOptionalString,
  mdId: importRequiredString,
  relationship: importOptionalString,
})

export const parentImportRequestSchema = z.object({
  adminUserId: z.string().min(1),
  rows: z.array(z.unknown()).min(1).max(500),
})

export const studentPhotoUploadSchema = z.object({
  // data: URLs from phone cameras can be large; compress client-side first.
  photo: z.string().min(1).max(2_500_000),
})

export const studentPhotoModerationSchema = z.object({
  action: z.enum(["approve", "deny"]),
})

