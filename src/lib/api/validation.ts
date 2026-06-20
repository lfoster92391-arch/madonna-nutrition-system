import { z } from "zod"

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
  grade: z.string().min(1),
  homeroom: z.string().optional(),
  balance: z.number(),
  photo: z.string().optional(),
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
  processedByUserId: z.string().min(1).optional(),
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

export const userRoleSchema = z.enum(["admin", "cashier", "parent", "staff", "teacher"])

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
  linkedStudentIds: z.array(z.string()).optional(),
  performedBy: z.string().optional(),
  reason: z.string().optional(),
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
  role: z.enum(["admin", "cashier", "parent", "teacher"]),
})

export const calendarEventSchema = z.object({
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
  type: z.enum(["receive", "adjust", "transfer", "production", "waste"]),
  quantity: z.number().positive(),
  note: z.string().optional(),
  createdBy: z.string().optional(),
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
