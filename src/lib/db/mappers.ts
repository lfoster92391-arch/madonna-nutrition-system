import type {
  AllergySeverity as PrismaAllergySeverity,
  AllergySubmissionStatus as PrismaSubmissionStatus,
  BadgeStatus as PrismaBadgeStatus,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from "@prisma/client"
import type {
  Prisma,
  Allergy as DbAllergy,
  AllergySubmission as DbAllergySubmission,
  AuditLog as DbAuditLog,
  CalendarEvent as DbCalendarEvent,
  CalendarSettings as DbCalendarSettings,
  MealPhoto as DbMealPhoto,
  MealTemplate as DbMealTemplate,
  MealTemplateItem as DbMealTemplateItem,
  MedicalDocument as DbMedicalDocument,
  ParentStudent,
  Student as DbStudent,
  StudentProfile as DbStudentProfile,
  Transaction as DbTransaction,
  User as DbUser,
} from "@prisma/client"
import type {
  Allergy,
  AllergySubmission,
  AllergySubmissionStatus,
  AuditLogEntry,
  CalendarEvent,
  CalendarSettings,
  FoodSafetyFormPayload,
  MealPhoto,
  MealTemplate,
  MealTemplateItem,
  MedicalDocument,
  Student,
  StudentProfile,
  Transaction,
  User,
  UserRole,
  UserStatus,
} from "@/lib/types"

type StudentWithRelations = DbStudent & {
  allergies: DbAllergy[]
  parentLinks: (ParentStudent & { parent: { name: string; email: string; phone: string | null; relationship?: never } })[]
  profile?: DbStudentProfile | null
}

type TransactionWithStudent = DbTransaction & {
  student: Pick<DbStudent, "externalId" | "firstName" | "lastName">
  processedBy?: Pick<DbUser, "firstName" | "lastName" | "badgeId"> | null
}

const ALLERGY_SEVERITY_TO_APP: Record<PrismaAllergySeverity, Allergy["severity"]> = {
  SEVERE: "severe",
  MODERATE: "moderate",
  INFORMATIONAL: "informational",
}

const ALLERGY_SEVERITY_TO_DB: Record<Allergy["severity"], PrismaAllergySeverity> = {
  severe: "SEVERE",
  moderate: "MODERATE",
  informational: "INFORMATIONAL",
}

const SUBMISSION_STATUS_TO_APP: Record<PrismaSubmissionStatus, AllergySubmissionStatus> = {
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  CLARIFICATION_REQUESTED: "clarification_requested",
}

const SUBMISSION_STATUS_TO_DB: Record<AllergySubmissionStatus, PrismaSubmissionStatus> = {
  pending_review: "PENDING_REVIEW",
  approved: "APPROVED",
  rejected: "REJECTED",
  clarification_requested: "CLARIFICATION_REQUESTED",
}

const USER_ROLE_TO_APP: Record<PrismaUserRole, UserRole> = {
  ADMIN: "admin",
  STAFF: "staff",
  CASHIER: "cashier",
  PARENT: "parent",
  TEACHER: "teacher",
  EXECUTIVE: "admin",
}

const USER_ROLE_TO_DB: Record<UserRole, PrismaUserRole> = {
  admin: "ADMIN",
  staff: "STAFF",
  cashier: "CASHIER",
  parent: "PARENT",
  teacher: "TEACHER",
}

const USER_STATUS_TO_APP: Record<PrismaUserStatus, UserStatus> = {
  ACTIVE: "active",
  DISABLED: "disabled",
}

const USER_STATUS_TO_DB: Record<UserStatus, PrismaUserStatus> = {
  active: "ACTIVE",
  disabled: "DISABLED",
}

const BADGE_STATUS_TO_APP: Record<PrismaBadgeStatus, NonNullable<Student["badgeStatus"]>> = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
}

const BADGE_STATUS_TO_DB: Record<NonNullable<Student["badgeStatus"]>, PrismaBadgeStatus> = {
  active: "ACTIVE",
  pending: "PENDING",
  inactive: "INACTIVE",
}

export function mapBadgeStatus(status: PrismaBadgeStatus): NonNullable<Student["badgeStatus"]> {
  return BADGE_STATUS_TO_APP[status]
}

export function badgeStatusToDb(status: NonNullable<Student["badgeStatus"]>): PrismaBadgeStatus {
  return BADGE_STATUS_TO_DB[status]
}

export function mapAllergy(allergy: DbAllergy): Allergy {
  return {
    name: allergy.name,
    severity: ALLERGY_SEVERITY_TO_APP[allergy.severity],
  }
}

export function mapStudent(student: StudentWithRelations): Student {
  return {
    id: student.externalId,
    firstName: student.firstName,
    lastName: student.lastName,
    photo:
      student.photo ??
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop",
    grade: student.grade,
    homeroom: student.homeroom ?? undefined,
    balance: Number(student.balance),
    allergies: student.allergies.map(mapAllergy),
    dietaryRestrictions: student.dietaryRestrictions,
    parentContacts: student.parentLinks.map((link) => ({
      name: link.parent.name,
      email: link.parent.email,
      phone: link.parent.phone ?? "",
      relationship: link.relationship,
    })),
    disabled: student.disabled,
    barcode: student.barcode ?? undefined,
    badgeStatus: mapBadgeStatus(student.badgeStatus),
  }
}

export function mapStudentProfile(profile: DbStudentProfile, externalId: string): StudentProfile {
  const dietary = Array.isArray(profile.dietaryRestrictions)
    ? (profile.dietaryRestrictions as string[])
    : []

  return {
    studentId: externalId,
    dietaryRestrictions: dietary,
    allergyVerified: profile.allergyVerified,
    allergyReviewedAt: profile.allergyReviewedAt?.toISOString() ?? null,
    allergyExpiresAt: profile.allergyExpiresAt?.toISOString() ?? null,
    updateRequestedAt: profile.updateRequestedAt?.toISOString() ?? null,
    medicalNotes: profile.medicalNotes ?? null,
    emergencyFoodContactName: profile.emergencyFoodContactName ?? null,
    emergencyFoodContactPhone: profile.emergencyFoodContactPhone ?? null,
  }
}

export function mapTransaction(tx: TransactionWithStudent): Transaction {
  const isDeposit = tx.type === "DEPOSIT"
  return {
    id: tx.id,
    studentId: tx.student.externalId,
    studentName: `${tx.student.firstName} ${tx.student.lastName}`,
    meal: tx.mealType,
    amount: Number(tx.amount),
    balanceAfter: Number(tx.balanceAfter),
    timestamp: tx.createdAt.toISOString(),
    type: isDeposit ? "deposit" : "meal",
    stripeSessionId: tx.stripeSessionId ?? undefined,
    processedByUserId: tx.processedByUserId ?? undefined,
    processedByName: tx.processedBy
      ? `${tx.processedBy.firstName} ${tx.processedBy.lastName}`
      : isDeposit
        ? undefined
        : "Station",
  }
}

export function mapUser(user: DbUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: USER_ROLE_TO_APP[user.role],
    status: USER_STATUS_TO_APP[user.status],
    phone: user.phone ?? undefined,
    badgeId: user.badgeId ?? undefined,
    department: user.department ?? undefined,
    accountBalance: user.accountBalance ? Number(user.accountBalance) : undefined,
    linkedStudentIds: user.linkedStudentIds,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export function mapAuditLog(log: DbAuditLog): AuditLogEntry {
  return {
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityType: log.entityType ?? undefined,
    entityId: log.entityId ?? undefined,
    metadata: (log.metadata as Record<string, unknown> | null) ?? undefined,
    performedBy: log.performedBy ?? undefined,
    performedAt: log.performedAt.toISOString(),
    previousValue: (log.previousValue as Record<string, unknown> | null) ?? undefined,
    newValue: (log.newValue as Record<string, unknown> | null) ?? undefined,
    reason: log.reason ?? undefined,
    createdAt: log.createdAt.toISOString(),
  }
}

export function mapCalendarEvent(event: DbCalendarEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    date: event.date.toISOString().slice(0, 10),
    description: event.description ?? undefined,
    category: event.category as CalendarEvent["category"],
    color: event.color ?? undefined,
    mealTemplateId: event.mealTemplateId ?? undefined,
    publishStatus: (event.publishStatus as CalendarEvent["publishStatus"]) ?? "draft",
    publishedAt: event.publishedAt?.toISOString(),
    notes: event.notes ?? undefined,
  }
}

export function mapMealPhoto(photo: DbMealPhoto): MealPhoto {
  return {
    id: photo.id,
    slot: photo.slot as MealPhoto["slot"],
    url: photo.url,
  }
}

export function mapMealTemplateItem(item: DbMealTemplateItem): MealTemplateItem {
  return {
    id: item.id,
    name: item.name,
    sortOrder: item.sortOrder,
  }
}

type MealTemplateWithRelations = DbMealTemplate & {
  items: DbMealTemplateItem[]
  photos: DbMealPhoto[]
}

export function mapMealTemplate(template: MealTemplateWithRelations): MealTemplate {
  return {
    id: template.id,
    name: template.name,
    description: template.description ?? undefined,
    category: template.category as MealTemplate["category"],
    mealType: template.mealType as MealTemplate["mealType"],
    allergens: template.allergens,
    ingredients: Array.isArray(template.ingredients)
      ? (template.ingredients as string[])
      : undefined,
    nutritionNotes: template.nutritionNotes ?? undefined,
    portionNotes: template.portionNotes ?? undefined,
    gradeAvailability: template.gradeAvailability as MealTemplate["gradeAvailability"],
    isReusable: template.isReusable,
    isFavorite: template.isFavorite,
    isPublished: template.isPublished,
    isArchived: template.isArchived,
    lastUsedAt: template.lastUsedAt?.toISOString(),
    studentMealPrice: template.studentMealPrice != null ? Number(template.studentMealPrice) : undefined,
    alaCartePrice: template.alaCartePrice != null ? Number(template.alaCartePrice) : undefined,
    staffMealPrice: template.staffMealPrice != null ? Number(template.staffMealPrice) : undefined,
    items: template.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapMealTemplateItem),
    photos: template.photos.map(mapMealPhoto),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  }
}

export function mapCalendarSettings(settings: DbCalendarSettings): CalendarSettings {
  return {
    headerTitle: settings.headerTitle,
    bannerMessage: settings.bannerMessage ?? undefined,
    accentColor: settings.accentColor as CalendarSettings["accentColor"],
    schoolName: settings.schoolName,
  }
}

export function mapAllergySubmission(
  submission: DbAllergySubmission,
  externalStudentId: string
): AllergySubmission {
  return {
    id: submission.id,
    studentId: externalStudentId,
    submittedBy: submission.submittedBy,
    changePayload: submission.changePayload as unknown as FoodSafetyFormPayload,
    status: SUBMISSION_STATUS_TO_APP[submission.status],
    reviewedBy: submission.reviewedBy ?? undefined,
    reviewedAt: submission.reviewedAt?.toISOString(),
    reviewNote: submission.reviewNote ?? undefined,
    createdAt: submission.createdAt.toISOString(),
  }
}

export function mapMedicalDocument(doc: DbMedicalDocument, externalStudentId: string): MedicalDocument {
  return {
    id: doc.id,
    studentId: externalStudentId,
    documentUrl: doc.documentUrl,
    fileName: doc.fileName,
    version: doc.version,
    uploadedAt: doc.uploadedAt.toISOString(),
    expiresAt: doc.expiresAt?.toISOString(),
    uploadedBy: doc.uploadedBy,
  }
}

export function toDbUserRole(role: UserRole): PrismaUserRole {
  return USER_ROLE_TO_DB[role]
}

export function toDbUserStatus(status: UserStatus): PrismaUserStatus {
  return USER_STATUS_TO_DB[status]
}

export function toDbAllergySeverity(severity: Allergy["severity"]): PrismaAllergySeverity {
  return ALLERGY_SEVERITY_TO_DB[severity]
}

export function toDbSubmissionStatus(status: AllergySubmissionStatus): PrismaSubmissionStatus {
  return SUBMISSION_STATUS_TO_DB[status]
}

export function allergiesToCreateInput(
  allergies: Allergy[]
): Prisma.AllergyCreateWithoutStudentInput[] {
  return allergies.map((allergy) => ({
    name: allergy.name,
    severity: toDbAllergySeverity(allergy.severity),
  }))
}
