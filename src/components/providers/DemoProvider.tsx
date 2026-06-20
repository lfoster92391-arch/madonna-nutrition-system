"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DEFAULT_CALENDAR_SETTINGS } from "@/config/calendar-defaults"
import { api } from "@/lib/api/client"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import {
  generateTempPassword,
  findUserByLogin,
  assertCanChangeUserRole,
  formatRoleChangeReason,
  userRoleSupportsBadge,
} from "@/lib/users"
import type {
  AllergySubmission,
  AllergySubmissionStatus,
  AuditLogEntry,
  CalendarEvent,
  CalendarSettings,
  FoodSafetyFormPayload,
  ImportLog,
  InventoryItem,
  MealTemplate,
  MedicalDocument,
  Notification,
  Student,
  StudentProfile,
  Transaction,
  User,
  UserRole,
} from "@/lib/types"

interface CreateUserInput {
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  badgeId?: string
  linkedStudentIds?: string[]
  password?: string
  generateTempPassword?: boolean
  forcePasswordChange?: boolean
  adminUserId?: string
}

interface ResetPasswordInput {
  password?: string
  generateTempPassword?: boolean
  forcePasswordChange?: boolean
  reason?: string
  adminUserId?: string
}

type CreateUserResult = User & { tempPassword?: string }
type ResetPasswordResult = { tempPassword?: string; forcePasswordChange?: boolean } | null

interface DemoContextValue {
  databaseEnabled: boolean
  isLoading: boolean
  students: Student[]
  transactions: Transaction[]
  inventory: InventoryItem[]
  notifications: Notification[]
  importLogs: ImportLog[]
  studentProfiles: StudentProfile[]
  allergySubmissions: AllergySubmission[]
  medicalDocuments: MedicalDocument[]
  auditLogs: AuditLogEntry[]
  calendarEvents: CalendarEvent[]
  calendarSettings: CalendarSettings
  mealTemplates: MealTemplate[]
  users: User[]
  addStudent: (student: Student) => void | Promise<void>
  updateStudent: (id: string, updates: Partial<Student>) => void | Promise<void>
  disableStudent: (id: string) => void | Promise<void>
  processMeal: (
    studentId: string,
    meal: string,
    amount: number,
    processedByUserId?: string
  ) => Transaction | null | Promise<Transaction | null>
  addFunds: (
    studentId: string,
    amount: number,
    performedBy?: string
  ) => Transaction | null | Promise<Transaction | null>
  addImportLog: (log: ImportLog) => void
  rollbackImport: (logId: string) => void
  bulkImportStudents: (newStudents: Student[]) => void | Promise<void>
  submitAllergyForm: (
    studentId: string,
    submittedBy: string,
    payload: FoodSafetyFormPayload
  ) => AllergySubmission | Promise<AllergySubmission>
  reviewAllergySubmission: (
    submissionId: string,
    action: "approve" | "reject" | "clarification",
    reviewedBy: string,
    reviewNote?: string
  ) => void | Promise<void>
  uploadMedicalDocument: (
    studentId: string,
    fileName: string,
    documentUrl: string,
    uploadedBy: string
  ) => MedicalDocument | Promise<MedicalDocument>
  updateParentContact: (
    studentId: string,
    contact: { name: string; email: string; phone: string }
  ) => void | Promise<void>
  getStudentProfile: (studentId: string) => StudentProfile | undefined
  updateCalendarSettings: (updates: Partial<CalendarSettings>) => void | Promise<void>
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => CalendarEvent | Promise<CalendarEvent>
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void | Promise<void>
  deleteCalendarEvent: (id: string) => void | Promise<void>
  addMealTemplate: (
    template: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">
  ) => MealTemplate | Promise<MealTemplate>
  updateMealTemplate: (id: string, updates: Partial<MealTemplate>) => void | Promise<void>
  duplicateMealTemplate: (id: string) => MealTemplate | Promise<MealTemplate>
  archiveMealTemplate: (id: string) => void | Promise<void>
  getUserByUsername: (username: string) => User | undefined
  createUser: (input: CreateUserInput, performedBy: string) => CreateUserResult | Promise<CreateUserResult>
  updateUser: (
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
    performedBy: string,
    reason?: string
  ) => User | null | Promise<User | null>
  updateUserRole: (
    id: string,
    role: UserRole,
    performedBy: string,
    adminUserId: string
  ) => User | Promise<User>
  disableUser: (id: string, performedBy: string, reason: string) => boolean | Promise<boolean>
  enableUser: (id: string, performedBy: string, reason?: string) => boolean | Promise<boolean>
  resetUserPassword: (
    id: string,
    performedBy: string,
    options?: ResetPasswordInput
  ) => ResetPasswordResult | Promise<ResetPasswordResult>
  deleteUser: (id: string, performedBy: string, reason: string) => boolean | Promise<boolean>
  recordUserLogin: (userId: string) => void | Promise<void>
}

const DemoContext = createContext<DemoContextValue | null>(null)

const EMPTY_IMPORT_LOGS: ImportLog[] = []

function requireDatabase(enabled: boolean) {
  if (!enabled) {
    throw new Error("Database is not configured. Set DATABASE_URL to use this feature.")
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [dbEnabled, setDbEnabled] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    api
      .getConfig()
      .then((config) => setDbEnabled(config.databaseEnabled))
      .catch(() => setDbEnabled(false))
      .finally(() => setConfigLoaded(true))
  }, [])

  const invalidate = useCallback(
    (...keys: string[]) => {
      keys.forEach((key) => {
        void queryClient.invalidateQueries({ queryKey: [key] })
      })
    },
    [queryClient]
  )

  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: api.getStudents,
    enabled: dbEnabled,
  })
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: api.getTransactions,
    enabled: dbEnabled,
  })
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
    enabled: dbEnabled,
  })
  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs"],
    queryFn: api.getAuditLogs,
    enabled: dbEnabled,
  })
  const calendarEventsQuery = useQuery({
    queryKey: ["calendar-events"],
    queryFn: api.getCalendarEvents,
    enabled: dbEnabled,
  })
  const calendarSettingsQuery = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: api.getCalendarSettings,
    enabled: dbEnabled,
  })
  const mealTemplatesQuery = useQuery({
    queryKey: ["meal-templates"],
    queryFn: api.getMealTemplates,
    enabled: dbEnabled,
  })
  const allergySubmissionsQuery = useQuery({
    queryKey: ["allergy-submissions"],
    queryFn: api.getAllergySubmissions,
    enabled: dbEnabled,
  })
  const studentProfilesQuery = useQuery({
    queryKey: ["student-profiles"],
    queryFn: api.getStudentProfiles,
    enabled: dbEnabled,
  })
  const medicalDocumentsQuery = useQuery({
    queryKey: ["medical-documents"],
    queryFn: api.getMedicalDocuments,
    enabled: dbEnabled,
  })

  const dbLoading =
    dbEnabled &&
    (studentsQuery.isLoading ||
      transactionsQuery.isLoading ||
      usersQuery.isLoading ||
      auditLogsQuery.isLoading)

  const students = dbEnabled ? (studentsQuery.data ?? []) : []
  const transactions = dbEnabled ? (transactionsQuery.data ?? []) : []
  const users = dbEnabled ? (usersQuery.data ?? []) : []
  const auditLogs = dbEnabled ? (auditLogsQuery.data ?? []) : []
  const calendarEvents = dbEnabled ? (calendarEventsQuery.data ?? []) : []
  const calendarSettings = dbEnabled
    ? (calendarSettingsQuery.data ?? DEFAULT_CALENDAR_SETTINGS)
    : DEFAULT_CALENDAR_SETTINGS
  const mealTemplates = dbEnabled ? (mealTemplatesQuery.data ?? []) : []
  const allergySubmissions = dbEnabled ? (allergySubmissionsQuery.data ?? []) : []
  const studentProfiles = dbEnabled ? (studentProfilesQuery.data ?? []) : []
  const medicalDocuments = dbEnabled ? (medicalDocumentsQuery.data ?? []) : []
  const inventory: InventoryItem[] = []
  const notifications: Notification[] = []
  const importLogs = EMPTY_IMPORT_LOGS

  const getUserByUsername = useCallback(
    (username: string) => findUserByLogin(users, username),
    [users]
  )

  const getStudentProfile = useCallback(
    (studentId: string) => studentProfiles.find((p) => p.studentId === studentId),
    [studentProfiles]
  )

  const addStudent = useCallback(
    async (student: Student) => {
      requireDatabase(dbEnabled)
      await api.createStudent(student)
      invalidate("students")
    },
    [dbEnabled, invalidate]
  )

  const updateStudent = useCallback(
    async (id: string, updates: Partial<Student>) => {
      requireDatabase(dbEnabled)
      await api.updateStudent(id, updates)
      invalidate("students")
    },
    [dbEnabled, invalidate]
  )

  const disableStudent = useCallback(
    async (id: string) => {
      requireDatabase(dbEnabled)
      await api.disableStudent(id)
      invalidate("students")
    },
    [dbEnabled, invalidate]
  )

  const processMeal = useCallback(
    async (studentId: string, meal: string, amount: number, processedByUserId?: string) => {
      requireDatabase(dbEnabled)
      try {
        const tx = await api.processMeal(studentId, meal, amount, processedByUserId)
        invalidate("students", "transactions")
        return tx
      } catch {
        return null
      }
    },
    [dbEnabled, invalidate]
  )

  const addFunds = useCallback(
    async (_studentId: string, _amount: number, _performedBy?: string) => {
      requireDatabase(dbEnabled)
      return null
    },
    [dbEnabled]
  )

  const addImportLog = useCallback((_log: ImportLog) => {
    /* import audit logs are persisted via API import flows */
  }, [])

  const rollbackImport = useCallback((_logId: string) => {
    /* rollback handled via admin import API when available */
  }, [])

  const bulkImportStudents = useCallback(
    async (newStudents: Student[]) => {
      requireDatabase(dbEnabled)
      for (const student of newStudents) {
        await api.createStudent(student)
      }
      invalidate("students")
    },
    [dbEnabled, invalidate]
  )

  const submitAllergyForm = useCallback(
    async (studentId: string, submittedBy: string, payload: FoodSafetyFormPayload) => {
      requireDatabase(dbEnabled)
      const submission = await api.submitAllergyForm(studentId, submittedBy, payload)
      invalidate("allergy-submissions")
      return submission
    },
    [dbEnabled, invalidate]
  )

  const reviewAllergySubmission = useCallback(
    async (
      submissionId: string,
      action: "approve" | "reject" | "clarification",
      reviewedBy: string,
      reviewNote?: string
    ) => {
      requireDatabase(dbEnabled)
      await api.reviewAllergySubmission(submissionId, action, reviewedBy, reviewNote)
      invalidate("allergy-submissions", "student-profiles", "students", "audit-logs")
    },
    [dbEnabled, invalidate]
  )

  const uploadMedicalDocument = useCallback(
    async (
      studentId: string,
      fileName: string,
      documentUrl: string,
      uploadedBy: string
    ) => {
      requireDatabase(dbEnabled)
      const doc = await api.uploadMedicalDocument(studentId, fileName, documentUrl, uploadedBy)
      invalidate("medical-documents")
      return doc
    },
    [dbEnabled, invalidate]
  )

  const updateParentContact = useCallback(
    async (studentId: string, contact: { name: string; email: string; phone: string }) => {
      requireDatabase(dbEnabled)
      await api.updateParentContact(studentId, contact)
      invalidate("students")
    },
    [dbEnabled, invalidate]
  )

  const updateCalendarSettings = useCallback(
    async (updates: Partial<CalendarSettings>) => {
      requireDatabase(dbEnabled)
      await api.updateCalendarSettings(updates)
      invalidate("calendar-settings")
    },
    [dbEnabled, invalidate]
  )

  const addCalendarEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      requireDatabase(dbEnabled)
      const created = await api.createCalendarEvent(event)
      invalidate("calendar-events")
      return created
    },
    [dbEnabled, invalidate]
  )

  const updateCalendarEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      requireDatabase(dbEnabled)
      await api.updateCalendarEvent(id, updates)
      invalidate("calendar-events")
    },
    [dbEnabled, invalidate]
  )

  const deleteCalendarEvent = useCallback(
    async (id: string) => {
      requireDatabase(dbEnabled)
      await api.deleteCalendarEvent(id)
      invalidate("calendar-events")
    },
    [dbEnabled, invalidate]
  )

  const addMealTemplate = useCallback(
    async (template: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">) => {
      requireDatabase(dbEnabled)
      const created = await api.createMealTemplate(template)
      invalidate("meal-templates")
      return created
    },
    [dbEnabled, invalidate]
  )

  const updateMealTemplate = useCallback(
    async (id: string, updates: Partial<MealTemplate>) => {
      requireDatabase(dbEnabled)
      await api.updateMealTemplate(id, updates)
      invalidate("meal-templates")
    },
    [dbEnabled, invalidate]
  )

  const duplicateMealTemplate = useCallback(
    async (id: string) => {
      requireDatabase(dbEnabled)
      const duplicate = await api.duplicateMealTemplate(id)
      invalidate("meal-templates")
      return duplicate
    },
    [dbEnabled, invalidate]
  )

  const archiveMealTemplate = useCallback(
    async (id: string) => {
      requireDatabase(dbEnabled)
      await api.archiveMealTemplate(id)
      invalidate("meal-templates")
    },
    [dbEnabled, invalidate]
  )

  const createUser = useCallback(
    async (input: CreateUserInput, performedBy: string) => {
      requireDatabase(dbEnabled)
      const result = await api.adminCreateUser({ ...input, performedBy })
      invalidate("users", "audit-logs")
      return { ...result.user, tempPassword: result.tempPassword }
    },
    [dbEnabled, invalidate]
  )

  const updateUser = useCallback(
    async (
      id: string,
      updates: Partial<Omit<User, "id" | "createdAt">>,
      performedBy: string,
      reason?: string
    ) => {
      requireDatabase(dbEnabled)
      const user = await api.updateUser(id, { ...updates, performedBy, reason })
      invalidate("users", "audit-logs")
      return user
    },
    [dbEnabled, invalidate]
  )

  const updateUserRole = useCallback(
    async (id: string, role: UserRole, performedBy: string, adminUserId: string) => {
      requireDatabase(dbEnabled)
      const user = await api.updateUserRole(id, { role, adminUserId, performedBy })
      invalidate("users", "audit-logs")
      return user
    },
    [dbEnabled, invalidate]
  )

  const disableUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      requireDatabase(dbEnabled)
      await api.disableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, invalidate]
  )

  const enableUser = useCallback(
    async (id: string, performedBy: string, reason?: string) => {
      requireDatabase(dbEnabled)
      await api.enableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, invalidate]
  )

  const resetUserPassword = useCallback(
    async (id: string, performedBy: string, options?: ResetPasswordInput) => {
      requireDatabase(dbEnabled)
      const result = await api.adminResetUserPassword(id, {
        adminUserId: options?.adminUserId ?? "",
        performedBy,
        password: options?.password,
        generateTempPassword: options?.generateTempPassword,
        forcePasswordChange: options?.forcePasswordChange,
        reason: options?.reason,
      })
      invalidate("audit-logs", "users")
      return result
    },
    [dbEnabled, invalidate]
  )

  const deleteUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      requireDatabase(dbEnabled)
      await api.deleteUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, invalidate]
  )

  const recordUserLogin = useCallback(
    async (userId: string) => {
      if (!dbEnabled) return
      await api.recordUserLogin(userId)
      invalidate("users")
    },
    [dbEnabled, invalidate]
  )

  const value = useMemo(
    () => ({
      databaseEnabled: dbEnabled,
      isLoading: !configLoaded || dbLoading,
      students,
      transactions,
      inventory,
      notifications,
      importLogs,
      studentProfiles,
      allergySubmissions,
      medicalDocuments,
      auditLogs,
      calendarEvents,
      calendarSettings,
      mealTemplates,
      users,
      addStudent,
      updateStudent,
      disableStudent,
      processMeal,
      addFunds,
      addImportLog,
      rollbackImport,
      bulkImportStudents,
      submitAllergyForm,
      reviewAllergySubmission,
      uploadMedicalDocument,
      updateParentContact,
      getStudentProfile,
      updateCalendarSettings,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      addMealTemplate,
      updateMealTemplate,
      duplicateMealTemplate,
      archiveMealTemplate,
      getUserByUsername,
      createUser,
      updateUser,
      updateUserRole,
      disableUser,
      enableUser,
      resetUserPassword,
      deleteUser,
      recordUserLogin,
    }),
    [
      dbEnabled,
      configLoaded,
      dbLoading,
      students,
      transactions,
      inventory,
      notifications,
      importLogs,
      studentProfiles,
      allergySubmissions,
      medicalDocuments,
      auditLogs,
      calendarEvents,
      calendarSettings,
      mealTemplates,
      users,
      addStudent,
      updateStudent,
      disableStudent,
      processMeal,
      addFunds,
      addImportLog,
      rollbackImport,
      bulkImportStudents,
      submitAllergyForm,
      reviewAllergySubmission,
      uploadMedicalDocument,
      updateParentContact,
      getStudentProfile,
      updateCalendarSettings,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      addMealTemplate,
      updateMealTemplate,
      duplicateMealTemplate,
      archiveMealTemplate,
      getUserByUsername,
      createUser,
      updateUser,
      updateUserRole,
      disableUser,
      enableUser,
      resetUserPassword,
      deleteUser,
      recordUserLogin,
    ]
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error("useDemo must be used within DemoProvider")
  return ctx
}

/** Alias for Phase 1 data layer */
export const useData = useDemo
