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
  crossContact: CrossContactSensitivity
  dietaryRestrictions: string[]
  otherDietaryDescription?: string
  emergencyMealNotes?: string
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

export interface AuditLogEntry {
  id: string
  action: string
  entity: string
  entityId?: string
  metadata?: Record<string, unknown>
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
}

export interface Transaction {
  id: string
  studentId: string
  studentName: string
  meal: string
  amount: number
  balanceAfter: number
  timestamp: string
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

export type FoodProfileStatus = "verified" | "pending_review" | "action_needed"

export function getFoodProfileStatus(
  profile: StudentProfile | undefined,
  pendingSubmission?: AllergySubmission
): FoodProfileStatus {
  if (pendingSubmission?.status === "pending_review" || pendingSubmission?.status === "clarification_requested") {
    return "pending_review"
  }
  if (!profile?.allergyVerified) return "action_needed"
  if (profile.allergyExpiresAt && new Date(profile.allergyExpiresAt) <= new Date()) {
    return "action_needed"
  }
  return "verified"
}
