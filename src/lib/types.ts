export type AllergySeverity = "severe" | "moderate" | "informational"

export interface Allergy {
  name: string
  severity: AllergySeverity
}

export interface ParentContact {
  name: string
  email: string
  phone: string
  relationship: string
}

export interface CrossContactSensitivity {
  avoidSharedEquipment: boolean
  traceAmountsTrigger: boolean
  ingredientOnly: boolean
}

export interface FoodSafetyFormPayload {
  allergies: string[]
  otherAllergyDescription?: string
  severity: AllergySeverity
  reactionInfo?: string
  medicalNotes?: string
  crossContact: CrossContactSensitivity
  dietaryRestrictions: string[]
  otherDietaryDescription?: string
  emergencyMealNotes?: string
  emergencyFoodContactName?: string
  emergencyFoodContactPhone?: string
  consentConfirmed: boolean
  electronicSignature: string
  signatureDate: string
}

export type AllergySubmissionStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "clarification_requested"

export interface StudentProfile {
  studentId: string
  dietaryRestrictions: string[]
  allergyVerified: boolean
  allergyReviewedAt: string | null
  allergyExpiresAt: string | null
  updateRequestedAt?: string | null
  medicalNotes?: string | null
  emergencyFoodContactName?: string | null
  emergencyFoodContactPhone?: string | null
}

export interface AllergySubmission {
  id: string
  studentId: string
  submittedBy: string
  changePayload: FoodSafetyFormPayload
  status: AllergySubmissionStatus
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
  createdAt: string
}

export interface MedicalDocument {
  id: string
  studentId: string
  documentUrl: string
  fileName: string
  version: number
  uploadedAt: string
  expiresAt?: string
  uploadedBy: string
}

export type UserRole = "admin" | "cashier" | "parent" | "staff" | "teacher"

export type UserStatus = "active" | "disabled"

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  badgeId?: string
  linkedStudentIds?: string[]
  phone?: string
  department?: string
  accountBalance?: number
  mustChangePassword?: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export type UserAuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DISABLED"
  | "USER_ENABLED"
  | "PASSWORD_RESET"
  | "ROLE_CHANGED"
  | "USER_DELETED"

export const USER_AUDIT_ACTIONS: UserAuditAction[] = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DISABLED",
  "USER_ENABLED",
  "PASSWORD_RESET",
  "ROLE_CHANGED",
  "USER_DELETED",
]

export interface AuditLogEntry {
  id: string
  action: string
  /** @deprecated Prefer entityType — kept for existing allergy/import logs */
  entity: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  performedBy?: string
  performedAt?: string
  previousValue?: Record<string, unknown> | string
  newValue?: Record<string, unknown> | string
  reason?: string
  ipAddress?: string
  createdAt: string
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  photo: string
  grade: string
  homeroom?: string
  balance: number
  allergies: Allergy[]
  dietaryRestrictions: string[]
  parentContacts: ParentContact[]
  disabled?: boolean
  /** Physical badge barcode; defaults to mdId when unset */
  barcode?: string
  badgeStatus?: "active" | "pending" | "inactive"
}

export type TransactionKind = "meal" | "deposit"

export interface Transaction {
  id: string
  studentId: string
  studentName: string
  meal: string
  amount: number
  balanceAfter: number
  timestamp: string
  type?: TransactionKind
  stripeSessionId?: string
  processedByUserId?: string
  processedByName?: string
}

export interface InventoryItem {
  id: string
  name: string
  qty: number
  unit: string
  cost: number
  expiration: string
  category: string
  lowStockThreshold: number
  barcode?: string
}

export interface Notification {
  id: string
  type: "low_balance" | "negative_balance" | "repeated_charges" | "missed_meals"
  studentId: string
  studentName: string
  message: string
  channel: "email" | "sms"
  sentAt: string
  read: boolean
}

export interface MenuItem {
  id: string
  name: string
  mealType: "breakfast" | "lunch" | "ala_carte"
  allergens: string[]
  calories: number
  date: string
}

export interface ImportLog {
  id: string
  filename: string
  importedAt: string
  totalRows: number
  successRows: number
  errorRows: number
  status: "completed" | "rolled_back" | "failed"
  importedStudentIds?: string[]
}

export interface MealPrice {
  type: string
  label: string
  price: number
  grades?: string[]
}

export const MEAL_PRICES: MealPrice[] = [
  { type: "student_meal", label: "Student Meal", price: 3.25 },
  { type: "staff_meal", label: "Staff Meal", price: 2.0 },
  { type: "ala_carte", label: "À La Carte", price: 4.5, grades: ["9", "10", "11", "12"] },
  { type: "milk", label: "Milk Only", price: 0.75 },
]

export type CalendarEventCategory =
  | "menu_day"
  | "holiday"
  | "early_dismissal"
  | "special_event"
  | "no_school"
  | "teacher_meal"

export type CalendarPublishStatus = "draft" | "published" | "scheduled" | "archived"

export type CalendarAccentColor = "navy" | "green" | "amber"

export interface CalendarEvent {
  id: string
  title: string
  date: string
  description?: string
  category: CalendarEventCategory
  color?: string
  /** Links a calendar menu_day event to a reusable meal template */
  mealTemplateId?: string
  publishStatus?: CalendarPublishStatus
  publishedAt?: string
  notes?: string
}

export type MealCategory =
  | "breakfast"
  | "lunch"
  | "recipe"
  | "dessert"
  | "side"
  | "drink"
  | "special_event"
  | "holiday"
  | "seasonal"
  | "archived"

export type MealPhotoSlot = "entree" | "side" | "dessert" | "drink" | "additional"

export type GradeAvailability = "grades_7_8" | "grades_9_12" | "teacher" | "staff"

export interface MealPhoto {
  id: string
  slot: MealPhotoSlot
  url: string
}

export interface MealTemplateItem {
  id: string
  name: string
  sortOrder: number
}

export interface MealTemplate {
  id: string
  name: string
  description?: string
  category: MealCategory
  mealType: "breakfast" | "lunch" | "special"
  allergens: string[]
  ingredients?: string[]
  nutritionNotes?: string
  portionNotes?: string
  gradeAvailability: GradeAvailability[]
  isReusable: boolean
  isFavorite: boolean
  isPublished: boolean
  isArchived: boolean
  lastUsedAt?: string
  studentMealPrice?: number
  alaCartePrice?: number
  staffMealPrice?: number
  items: MealTemplateItem[]
  photos: MealPhoto[]
  createdAt: string
  updatedAt: string
}

export interface CalendarSettings {
  headerTitle: string
  bannerMessage?: string
  accentColor: CalendarAccentColor
  schoolName: string
}

export type FoodProfileStatus = "complete" | "needs_review" | "overdue" | "incomplete"

export function getFoodProfileStatus(
  profile: StudentProfile | undefined,
  pendingSubmission?: AllergySubmission
): FoodProfileStatus {
  if (
    pendingSubmission?.status === "pending_review" ||
    pendingSubmission?.status === "clarification_requested"
  ) {
    return "needs_review"
  }
  if (!profile?.allergyVerified) return "incomplete"
  if (profile.updateRequestedAt) return "needs_review"
  if (profile.allergyExpiresAt && new Date(profile.allergyExpiresAt) <= new Date()) {
    return "overdue"
  }
  if (profile.allergyExpiresAt) {
    const expires = new Date(profile.allergyExpiresAt).getTime()
    const threshold = Date.now() + 30 * 24 * 60 * 60 * 1000
    if (expires <= threshold) return "needs_review"
  }
  return "complete"
}

export function getFoodProfileDisplayLabel(status: FoodProfileStatus): string {
  switch (status) {
    case "complete":
      return "Complete"
    case "needs_review":
      return "Needs Review"
    case "overdue":
      return "Overdue"
    case "incomplete":
      return "Action Needed"
  }
}

export function isDietaryFormBlocking(
  profile: StudentProfile | undefined,
  pendingSubmission?: AllergySubmission
): boolean {
  return getFoodProfileStatus(profile, pendingSubmission) !== "complete"
}
