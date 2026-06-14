import type {
  AllergySubmission,
  AuditLogEntry,
  ImportLog,
  InventoryItem,
  MedicalDocument,
  MenuItem,
  Notification,
  Student,
  StudentProfile,
  Transaction,
} from "@/lib/types"
import { addOneYear } from "@/lib/food-safety"

export const DEMO_SCHOOL = {
  id: "school-demo-001",
  name: "Madonna High School",
  slug: "madonna-high-school",
  primaryColor: "#001E62",
  location: "Weirton, WV",
}

export const parentDemoUser = {
  name: "Sarah Anderson",
  email: "sarah.anderson@email.com",
}

const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
const expiredDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
const reviewedOneYearAgo = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000).toISOString()

/** Anderson family — linked to parent portal demo */
export const parentLinkedStudents: Student[] = [
  {
    id: "10457",
    firstName: "James",
    lastName: "Anderson",
    grade: "10",
    homeroom: "10B",
    balance: 12.45,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    allergies: [
      { name: "Peanut", severity: "severe" },
      { name: "Tree Nut", severity: "severe" },
    ],
    dietaryRestrictions: [],
    parentContacts: [
      { name: "Sarah Anderson", email: "sarah.anderson@email.com", phone: "555-0201", relationship: "Mother" },
    ],
  },
  {
    id: "10458",
    firstName: "Emma",
    lastName: "Anderson",
    grade: "8",
    homeroom: "8A",
    balance: 36.3,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    allergies: [{ name: "Dairy", severity: "moderate" }],
    dietaryRestrictions: ["Vegetarian"],
    parentContacts: [
      { name: "Sarah Anderson", email: "sarah.anderson@email.com", phone: "555-0201", relationship: "Mother" },
    ],
  },
  {
    id: "10459",
    firstName: "Michael",
    lastName: "Anderson",
    grade: "5",
    homeroom: "5C",
    balance: 0,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
    allergies: [{ name: "Egg", severity: "informational" }],
    dietaryRestrictions: [],
    parentContacts: [
      { name: "Sarah Anderson", email: "sarah.anderson@email.com", phone: "555-0201", relationship: "Mother" },
    ],
  },
]

export const demoStudentProfiles: StudentProfile[] = [
  {
    studentId: "10457",
    dietaryRestrictions: [],
    allergyVerified: true,
    allergyReviewedAt: eightDaysAgo,
    allergyExpiresAt: addOneYear(new Date(eightDaysAgo)),
  },
  {
    studentId: "10458",
    dietaryRestrictions: ["Vegetarian"],
    allergyVerified: true,
    allergyReviewedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    allergyExpiresAt: new Date(Date.now() + 245 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    studentId: "10459",
    dietaryRestrictions: [],
    allergyVerified: true,
    allergyReviewedAt: reviewedOneYearAgo,
    allergyExpiresAt: expiredDate,
  },
]

export const demoAllergySubmissions: AllergySubmission[] = [
  {
    id: "sub-001",
    studentId: "10458",
    submittedBy: "Sarah Anderson",
    changePayload: {
      allergies: ["Dairy", "Soy"],
      severity: "moderate",
      reactionInfo: "Hives and stomach upset within 30 minutes of exposure.",
      crossContact: {
        avoidSharedEquipment: true,
        traceAmountsTrigger: false,
        ingredientOnly: false,
      },
      dietaryRestrictions: ["Vegetarian", "Dairy Free"],
      emergencyMealNotes: "Safe alternative: grilled chicken with rice, no sauce.",
      consentConfirmed: true,
      electronicSignature: "Sarah Anderson",
      signatureDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
    status: "pending_review",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const demoMedicalDocuments: MedicalDocument[] = [
  {
    id: "doc-001",
    studentId: "10457",
    documentUrl: "data:application/pdf;base64,demo-allergy-action-plan",
    fileName: "James_Allergy_Action_Plan.pdf",
    version: 1,
    uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: addOneYear(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
    uploadedBy: "Sarah Anderson",
  },
  {
    id: "doc-002",
    studentId: "10457",
    documentUrl: "data:application/pdf;base64,demo-epipen-prescription",
    fileName: "James_EpiPen_Prescription.pdf",
    version: 2,
    uploadedAt: eightDaysAgo,
    expiresAt: addOneYear(new Date(eightDaysAgo)),
    uploadedBy: "Sarah Anderson",
  },
  {
    id: "doc-003",
    studentId: "10458",
    documentUrl: "data:image/png;base64,demo-doctor-note",
    fileName: "Emma_Doctor_Note.png",
    version: 1,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    uploadedBy: "Sarah Anderson",
  },
]

export const demoAuditLogs: AuditLogEntry[] = [
  {
    id: "audit-001",
    action: "ALLERGY_PROFILE_APPROVED",
    entity: "student_profile",
    entityId: "10457",
    metadata: { reviewedBy: "Nutrition Office", allergies: ["Peanut", "Tree Nut"] },
    createdAt: eightDaysAgo,
  },
]

export const parentRecentActivity = [
  { date: "May 27", description: "Lunch Purchase", amount: -3.25, student: "James Anderson" },
  { date: "May 26", description: "Account Deposit", amount: 25.0, student: "Emma Anderson" },
  { date: "May 25", description: "Lunch Purchase", amount: -3.25, student: "James Anderson" },
  { date: "May 24", description: "Milk Only", amount: -0.75, student: "Emma Anderson" },
  { date: "May 23", description: "Lunch Purchase", amount: -3.25, student: "Michael Anderson" },
]

export const parentAnnouncements = [
  {
    id: "ann-1",
    title: "Summer Meal Program",
    body: "Free summer lunch program begins June 10. Register your students online.",
  },
  {
    id: "ann-2",
    title: "Menu Changes",
    body: "New vegetarian options added to the weekly lunch menu starting next Monday.",
  },
]

export const parentSpendingByWeek = [
  { week: "Week 1", amount: 8.5 },
  { week: "Week 2", amount: 12.25 },
  { week: "Week 3", amount: 9.75 },
  { week: "Week 4", amount: 7.75 },
]

export const todaysMenuItems = [
  "Spaghetti with Meat Sauce",
  "Garlic Breadstick",
  "Steamed Broccoli",
  "Mixed Fruit",
  "Milk",
]

export const demoStudents: Student[] = [
  ...parentLinkedStudents,
  {
    id: "1001",
    firstName: "Sophia",
    lastName: "Martinez",
    grade: "10",
    homeroom: "10A",
    balance: 12.5,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
    allergies: [
      { name: "Peanuts", severity: "severe" },
      { name: "Tree Nuts", severity: "severe" },
    ],
    dietaryRestrictions: [],
    parentContacts: [
      { name: "Maria Martinez", email: "maria.m@email.com", phone: "555-0101", relationship: "Mother" },
    ],
  },
  {
    id: "1002",
    firstName: "Ethan",
    lastName: "Walker",
    grade: "11",
    homeroom: "11B",
    balance: 8.25,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: ["Vegetarian"],
    parentContacts: [
      { name: "James Walker", email: "j.walker@email.com", phone: "555-0102", relationship: "Father" },
    ],
  },
  {
    id: "1003",
    firstName: "Ava",
    lastName: "Johnson",
    grade: "9",
    homeroom: "9C",
    balance: -2.5,
    photo: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=400&auto=format&fit=crop",
    allergies: [{ name: "Dairy", severity: "moderate" }],
    dietaryRestrictions: ["Lactose-free"],
    parentContacts: [
      { name: "Lisa Johnson", email: "l.johnson@email.com", phone: "555-0103", relationship: "Mother" },
    ],
  },
  {
    id: "1004",
    firstName: "Marcus",
    lastName: "Chen",
    grade: "12",
    homeroom: "12A",
    balance: 45.0,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    allergies: [{ name: "Shellfish", severity: "informational" }],
    dietaryRestrictions: [],
    parentContacts: [
      { name: "Wei Chen", email: "w.chen@email.com", phone: "555-0104", relationship: "Father" },
    ],
  },
  {
    id: "1005",
    firstName: "Emma",
    lastName: "Rodriguez",
    grade: "7",
    homeroom: "7B",
    balance: 6.0,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop",
    allergies: [{ name: "Eggs", severity: "moderate" }],
    dietaryRestrictions: [],
    parentContacts: [
      { name: "Carlos Rodriguez", email: "c.rodriguez@email.com", phone: "555-0105", relationship: "Father" },
    ],
  },
  {
    id: "1006",
    firstName: "Noah",
    lastName: "Williams",
    grade: "8",
    homeroom: "8D",
    balance: 22.75,
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop",
    allergies: [],
    dietaryRestrictions: ["Gluten-free"],
    parentContacts: [
      { name: "Sarah Williams", email: "s.williams@email.com", phone: "555-0106", relationship: "Mother" },
    ],
  },
]

export const demoTransactions: Transaction[] = [
  {
    id: "tx-001",
    studentId: "1001",
    studentName: "Sophia Martinez",
    meal: "Lunch",
    amount: 3.25,
    balanceAfter: 12.5,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "tx-002",
    studentId: "1002",
    studentName: "Ethan Walker",
    meal: "Breakfast",
    amount: 2.0,
    balanceAfter: 8.25,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "tx-003",
    studentId: "1004",
    studentName: "Marcus Chen",
    meal: "A La Carte",
    amount: 4.5,
    balanceAfter: 45.0,
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "tx-004",
    studentId: "1005",
    studentName: "Emma Rodriguez",
    meal: "Lunch",
    amount: 3.25,
    balanceAfter: 6.0,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "tx-005",
    studentId: "1006",
    studentName: "Noah Williams",
    meal: "Milk",
    amount: 0.75,
    balanceAfter: 22.75,
    timestamp: new Date(Date.now() - 18000000).toISOString(),
  },
]

export const demoInventory: InventoryItem[] = [
  { id: "inv-1", name: "Chocolate Milk", qty: 24, unit: "cartons", cost: 0.65, expiration: "2026-05-18", category: "Dairy", lowStockThreshold: 10 },
  { id: "inv-2", name: "Chicken Patties", qty: 8, unit: "cases", cost: 42.5, expiration: "2026-06-10", category: "Frozen", lowStockThreshold: 12 },
  { id: "inv-3", name: "Apple Slices", qty: 42, unit: "bags", cost: 3.25, expiration: "2026-05-14", category: "Produce", lowStockThreshold: 15 },
  { id: "inv-4", name: "French Fries", qty: 5, unit: "cases", cost: 28.0, expiration: "2026-07-01", category: "Frozen", lowStockThreshold: 10 },
  { id: "inv-5", name: "Hamburger Buns", qty: 60, unit: "packs", cost: 2.15, expiration: "2026-05-13", category: "Bakery", lowStockThreshold: 20 },
  { id: "inv-6", name: "Whole Wheat Bread", qty: 18, unit: "loaves", cost: 1.85, expiration: "2026-05-20", category: "Bakery", lowStockThreshold: 15 },
  { id: "inv-7", name: "Orange Juice", qty: 3, unit: "gallons", cost: 4.5, expiration: "2026-05-12", category: "Beverages", lowStockThreshold: 5 },
]

export const demoNotifications: Notification[] = [
  {
    id: "n-1",
    type: "low_balance",
    studentId: "1005",
    studentName: "Emma Rodriguez",
    message: "Emma's cafeteria balance is below $10. Consider adding funds to ensure uninterrupted meal service.",
    channel: "email",
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    read: false,
  },
  {
    id: "n-2",
    type: "negative_balance",
    studentId: "1003",
    studentName: "Ava Johnson",
    message: "Ava's account balance requires attention. We've extended meal service today — please add funds at your convenience.",
    channel: "email",
    sentAt: new Date(Date.now() - 172800000).toISOString(),
    read: true,
  },
  {
    id: "n-3",
    type: "repeated_charges",
    studentId: "1004",
    studentName: "Marcus Chen",
    message: "Multiple a la carte purchases detected today. This is an informational notice for your records.",
    channel: "email",
    sentAt: new Date(Date.now() - 43200000).toISOString(),
    read: false,
  },
  {
    id: "n-4",
    type: "missed_meals",
    studentId: "1002",
    studentName: "Ethan Walker",
    message: "Ethan has not checked in for lunch this week. Please contact the cafeteria if this is unexpected.",
    channel: "email",
    sentAt: new Date(Date.now() - 259200000).toISOString(),
    read: true,
  },
]

export const demoMenus: MenuItem[] = [
  { id: "m-1", name: "Scrambled Eggs & Toast", mealType: "breakfast", allergens: ["Eggs", "Gluten"], calories: 320, date: "2026-06-13" },
  { id: "m-2", name: "Chicken Caesar Wrap", mealType: "lunch", allergens: ["Gluten", "Dairy"], calories: 480, date: "2026-06-13" },
  { id: "m-3", name: "Veggie Burger", mealType: "lunch", allergens: ["Gluten"], calories: 410, date: "2026-06-13" },
  { id: "m-4", name: "Fresh Fruit Cup", mealType: "ala_carte", allergens: [], calories: 90, date: "2026-06-13" },
  { id: "m-5", name: "Chocolate Chip Cookie", mealType: "ala_carte", allergens: ["Gluten", "Dairy", "Eggs"], calories: 180, date: "2026-06-13" },
]

export const demoImportLogs: ImportLog[] = [
  {
    id: "imp-1",
    filename: "students_spring_2026.csv",
    importedAt: new Date(Date.now() - 604800000).toISOString(),
    totalRows: 156,
    successRows: 154,
    errorRows: 2,
    status: "completed",
  },
  {
    id: "imp-2",
    filename: "new_enrollments.csv",
    importedAt: new Date(Date.now() - 259200000).toISOString(),
    totalRows: 12,
    successRows: 12,
    errorRows: 0,
    status: "completed",
  },
]

export function getAllergyBannerStyle(severity: import("@/lib/types").Allergy["severity"]) {
  switch (severity) {
    case "severe":
      return { bg: "bg-danger/10 border-danger", text: "text-danger", label: "SEVERE ALLERGY" }
    case "moderate":
      return { bg: "bg-warning/10 border-warning", text: "text-warning", label: "MODERATE ALLERGY" }
    case "informational":
      return { bg: "bg-primary/10 border-primary", text: "text-primary", label: "DIETARY NOTE" }
  }
}

export function getHighestAllergySeverity(
  allergies: import("@/lib/types").Allergy[]
): import("@/lib/types").Allergy["severity"] | null {
  if (allergies.length === 0) return null
  if (allergies.some((a) => a.severity === "severe")) return "severe"
  if (allergies.some((a) => a.severity === "moderate")) return "moderate"
  return "informational"
}

export function getStudentProfile(studentId: string, profiles: StudentProfile[]): StudentProfile | undefined {
  return profiles.find((p) => p.studentId === studentId)
}

export function getPendingSubmission(
  studentId: string,
  submissions: AllergySubmission[]
): AllergySubmission | undefined {
  return submissions.find(
    (s) =>
      s.studentId === studentId &&
      (s.status === "pending_review" || s.status === "clarification_requested")
  )
}

export function getMedicalDocumentsForStudent(
  studentId: string,
  documents: MedicalDocument[]
): MedicalDocument[] {
  return documents
    .filter((d) => d.studentId === studentId)
    .sort((a, b) => b.version - a.version)
}
