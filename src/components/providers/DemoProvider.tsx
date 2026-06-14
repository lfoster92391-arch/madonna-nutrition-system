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
import {
  demoAllergySubmissions,
  demoAuditLogs,
  demoCalendarEvents,
  demoCalendarSettings,
  demoImportLogs,
  demoInventory,
  demoMealTemplates,
  demoMedicalDocuments,
  demoNotifications,
  demoStudentProfiles,
  demoStudents,
  demoTransactions,
  demoUsers,
} from "@/data/demo"
import { api } from "@/lib/api/client"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import { generateTempPassword, findUserByLogin } from "@/lib/users"
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
}

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
  createUser: (input: CreateUserInput, performedBy: string) => User | Promise<User>
  updateUser: (
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
    performedBy: string,
    reason?: string
  ) => User | null | Promise<User | null>
  disableUser: (id: string, performedBy: string, reason: string) => boolean | Promise<boolean>
  enableUser: (id: string, performedBy: string, reason?: string) => boolean | Promise<boolean>
  resetUserPassword: (id: string, performedBy: string) => { tempPassword: string } | null | Promise<{ tempPassword: string } | null>
  deleteUser: (id: string, performedBy: string, reason: string) => boolean | Promise<boolean>
  recordUserLogin: (userId: string) => void | Promise<void>
}

const DemoContext = createContext<DemoContextValue | null>(null)

function useDemoLocalState() {
  const [students, setStudents] = useState<Student[]>(demoStudents)
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions)
  const [inventory] = useState<InventoryItem[]>(demoInventory)
  const [notifications] = useState<Notification[]>(demoNotifications)
  const [importLogs, setImportLogs] = useState<ImportLog[]>(demoImportLogs)
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>(demoStudentProfiles)
  const [allergySubmissions, setAllergySubmissions] =
    useState<AllergySubmission[]>(demoAllergySubmissions)
  const [medicalDocuments, setMedicalDocuments] =
    useState<MedicalDocument[]>(demoMedicalDocuments)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(demoAuditLogs)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(demoCalendarEvents)
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(demoCalendarSettings)
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(demoMealTemplates)
  const [users, setUsers] = useState<User[]>(demoUsers)

  const appendAuditLog = useCallback(
    (entry: Omit<AuditLogEntry, "id" | "createdAt"> & { createdAt?: string }) => {
      const now = entry.createdAt ?? new Date().toISOString()
      const log: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: now,
        performedAt: entry.performedAt ?? now,
        ...entry,
        entityType: entry.entityType ?? entry.entity,
      }
      setAuditLogs((prev) => [log, ...prev])
      return log
    },
    []
  )

  const getUserByUsername = useCallback(
    (username: string) => findUserByLogin(users, username),
    [users]
  )

  const createUser = useCallback(
    (input: CreateUserInput, performedBy: string): User => {
      const now = new Date().toISOString()
      const user: User = {
        id: `usr-${Date.now()}`,
        ...input,
        status: "active",
        createdAt: now,
        updatedAt: now,
      }
      setUsers((prev) => [...prev, user])
      appendAuditLog({
        action: "USER_CREATED",
        entity: "user",
        entityType: "user",
        entityId: user.id,
        performedBy,
        newValue: {
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          badgeId: user.badgeId,
        },
      })
      return user
    },
    [appendAuditLog]
  )

  const updateUser = useCallback(
    (
      id: string,
      updates: Partial<Omit<User, "id" | "createdAt">>,
      performedBy: string,
      reason?: string
    ): User | null => {
      let updated: User | null = null
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u
          const previous = { ...u }
          updated = { ...u, ...updates, updatedAt: new Date().toISOString() }
          appendAuditLog({
            action: "USER_UPDATED",
            entity: "user",
            entityType: "user",
            entityId: id,
            performedBy,
            previousValue: {
              firstName: previous.firstName,
              lastName: previous.lastName,
              email: previous.email,
              role: previous.role,
              phone: previous.phone,
              badgeId: previous.badgeId,
              linkedStudentIds: previous.linkedStudentIds,
            },
            newValue: {
              firstName: updated.firstName,
              lastName: updated.lastName,
              email: updated.email,
              role: updated.role,
              phone: updated.phone,
              badgeId: updated.badgeId,
              linkedStudentIds: updated.linkedStudentIds,
            },
            reason,
          })
          return updated
        })
      )
      return updated
    },
    [appendAuditLog]
  )

  const disableUser = useCallback(
    (id: string, performedBy: string, reason: string): boolean => {
      const target = users.find((u) => u.id === id)
      if (!target || target.status === "disabled") return false
      const now = new Date().toISOString()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "disabled", updatedAt: now } : u
        )
      )
      appendAuditLog({
        action: "USER_DISABLED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        previousValue: { status: "active" },
        newValue: { status: "disabled" },
        reason,
      })
      return true
    },
    [appendAuditLog, users]
  )

  const enableUser = useCallback(
    (id: string, performedBy: string, reason?: string): boolean => {
      const target = users.find((u) => u.id === id)
      if (!target || target.status === "active") return false
      const now = new Date().toISOString()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: "active", updatedAt: now } : u
        )
      )
      appendAuditLog({
        action: "USER_ENABLED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        previousValue: { status: "disabled" },
        newValue: { status: "active" },
        reason,
      })
      return true
    },
    [appendAuditLog, users]
  )

  const resetUserPassword = useCallback(
    (id: string, performedBy: string): { tempPassword: string } | null => {
      const target = users.find((u) => u.id === id)
      if (!target) return null
      const tempPassword = generateTempPassword()
      appendAuditLog({
        action: "PASSWORD_RESET",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        metadata: { method: "temp_password", clerkReady: true, resetSent: true },
        newValue: { resetSent: true },
      })
      return { tempPassword }
    },
    [appendAuditLog, users]
  )

  const deleteUser = useCallback(
    (id: string, performedBy: string, reason: string): boolean => {
      const target = users.find((u) => u.id === id)
      if (!target) return false
      setUsers((prev) => prev.filter((u) => u.id !== id))
      appendAuditLog({
        action: "USER_DELETED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        previousValue: {
          username: target.username,
          email: target.email,
          role: target.role,
        },
        reason,
      })
      return true
    },
    [appendAuditLog, users]
  )

  const recordUserLogin = useCallback((userId: string) => {
    const now = new Date().toISOString()
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, lastLoginAt: now, updatedAt: now } : u))
    )
  }, [])

  const addStudent = useCallback((student: Student) => {
    setStudents((prev) => [...prev, student])
  }, [])

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }, [])

  const disableStudent = useCallback((id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, disabled: true } : s))
    )
  }, [])

  const processMeal = useCallback(
    (studentId: string, meal: string, amount: number, processedByUserId?: string): Transaction | null => {
      const student = students.find((s) => s.id === studentId && !s.disabled)
      if (!student) return null

      const cashier = processedByUserId ? users.find((u) => u.id === processedByUserId) : undefined
      const balanceAfter = student.balance - amount
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        meal,
        amount,
        balanceAfter,
        timestamp: new Date().toISOString(),
        processedByUserId,
        processedByName: cashier ? `${cashier.firstName} ${cashier.lastName}` : undefined,
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, balance: balanceAfter } : s))
      )
      setTransactions((prev) => [tx, ...prev])
      return tx
    },
    [students, users]
  )

  const addFunds = useCallback(
    (studentId: string, amount: number, performedBy?: string): Transaction | null => {
      const student = students.find((s) => s.id === studentId && !s.disabled)
      if (!student) return null

      const balanceAfter = student.balance + amount
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        meal: "Card Deposit (Demo)",
        amount,
        balanceAfter,
        timestamp: new Date().toISOString(),
        type: "deposit",
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, balance: balanceAfter } : s))
      )
      setTransactions((prev) => [tx, ...prev])
      appendAuditLog({
        action: "FUNDS_ADDED",
        entity: "student_balance",
        entityType: "student",
        entityId: studentId,
        performedBy: performedBy ?? "parent_demo",
        metadata: { amount, source: "demo_deposit" },
        newValue: { balance: balanceAfter },
      })
      return tx
    },
    [students, appendAuditLog]
  )

  const addImportLog = useCallback((log: ImportLog) => {
    setImportLogs((prev) => [log, ...prev])
  }, [])

  const rollbackImport = useCallback((logId: string) => {
    setImportLogs((prev) => {
      const log = prev.find((l) => l.id === logId)
      if (log?.importedStudentIds?.length) {
        setStudents((s) => s.filter((st) => !log.importedStudentIds!.includes(st.id)))
      }
      return prev.map((l) =>
        l.id === logId ? { ...l, status: "rolled_back" as const } : l
      )
    })
  }, [])

  const bulkImportStudents = useCallback((newStudents: Student[]) => {
    setStudents((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const toAdd = newStudents.filter((s) => !existingIds.has(s.id))
      return [...prev, ...toAdd]
    })
  }, [])

  const getStudentProfile = useCallback(
    (studentId: string) => studentProfiles.find((p) => p.studentId === studentId),
    [studentProfiles]
  )

  const submitAllergyForm = useCallback(
    (studentId: string, submittedBy: string, payload: FoodSafetyFormPayload): AllergySubmission => {
      const submission: AllergySubmission = {
        id: `sub-${Date.now()}`,
        studentId,
        submittedBy,
        changePayload: payload,
        status: "pending_review",
        createdAt: new Date().toISOString(),
      }
      setAllergySubmissions((prev) => [
        submission,
        ...prev.filter(
          (s) =>
            !(
              s.studentId === studentId &&
              (s.status === "pending_review" || s.status === "clarification_requested")
            )
        ),
      ])
      return submission
    },
    []
  )

  const reviewAllergySubmission = useCallback(
    (
      submissionId: string,
      action: "approve" | "reject" | "clarification",
      reviewedBy: string,
      reviewNote?: string
    ) => {
      const now = new Date().toISOString()
      const status: AllergySubmissionStatus =
        action === "approve"
          ? "approved"
          : action === "reject"
            ? "rejected"
            : "clarification_requested"

      setAllergySubmissions((prev) => {
        const submission = prev.find((s) => s.id === submissionId)
        if (!submission) return prev

        if (action === "approve") {
          const allergies = payloadToAllergies(submission.changePayload)
          const dietary = submission.changePayload.dietaryRestrictions.filter(
            (d) => d !== "Other"
          )
          if (submission.changePayload.otherDietaryDescription) {
            dietary.push(submission.changePayload.otherDietaryDescription)
          }

          setStudents((s) =>
            s.map((st) =>
              st.id === submission.studentId
                ? { ...st, allergies, dietaryRestrictions: dietary }
                : st
            )
          )

          setStudentProfiles((profiles) => {
            const existing = profiles.find((p) => p.studentId === submission.studentId)
            const updated: StudentProfile = {
              studentId: submission.studentId,
              dietaryRestrictions: dietary,
              allergyVerified: true,
              allergyReviewedAt: now,
              allergyExpiresAt: addOneYear(new Date(now)),
            }
            if (existing) {
              return profiles.map((p) =>
                p.studentId === submission.studentId ? updated : p
              )
            }
            return [...profiles, updated]
          })

          setAuditLogs((logs) => [
            {
              id: `audit-${Date.now()}`,
              action: "ALLERGY_PROFILE_APPROVED",
              entity: "student_profile",
              entityId: submission.studentId,
              metadata: {
                reviewedBy,
                submissionId,
                allergies: allergies.map((a) => a.name),
              },
              createdAt: now,
            },
            ...logs,
          ])
        }

        return prev.map((s) =>
          s.id === submissionId
            ? { ...s, status, reviewedBy, reviewedAt: now, reviewNote }
            : s
        )
      })
    },
    []
  )

  const uploadMedicalDocument = useCallback(
    (
      studentId: string,
      fileName: string,
      documentUrl: string,
      uploadedBy: string
    ): MedicalDocument => {
      const existing = medicalDocuments.filter((d) => d.studentId === studentId)
      const maxVersion = existing.reduce((max, d) => Math.max(max, d.version), 0)
      const doc: MedicalDocument = {
        id: `doc-${Date.now()}`,
        studentId,
        documentUrl,
        fileName,
        version: maxVersion + 1,
        uploadedAt: new Date().toISOString(),
        expiresAt: addOneYear(),
        uploadedBy,
      }
      setMedicalDocuments((prev) => [...prev, doc])
      return doc
    },
    [medicalDocuments]
  )

  const updateParentContact = useCallback(
    (studentId: string, contact: { name: string; email: string; phone: string }) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id !== studentId) return s
          const contacts = [...s.parentContacts]
          if (contacts.length > 0) {
            contacts[0] = { ...contacts[0], ...contact }
          } else {
            contacts.push({ ...contact, relationship: "Guardian" })
          }
          return { ...s, parentContacts: contacts }
        })
      )
    },
    []
  )

  const updateCalendarSettings = useCallback((updates: Partial<CalendarSettings>) => {
    setCalendarSettings((prev) => ({ ...prev, ...updates }))
  }, [])

  const addCalendarEvent = useCallback((event: Omit<CalendarEvent, "id">): CalendarEvent => {
    const newEvent: CalendarEvent = { ...event, id: `cal-${Date.now()}` }
    setCalendarEvents((prev) => [...prev, newEvent])
    return newEvent
  }, [])

  const updateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    )
  }, [])

  const deleteCalendarEvent = useCallback((id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addMealTemplate = useCallback(
    (template: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">): MealTemplate => {
      const now = new Date().toISOString()
      const newTemplate: MealTemplate = {
        ...template,
        id: `mt-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        items: template.items.map((item, i) => ({
          ...item,
          id: item.id || `mti-${Date.now()}-${i}`,
        })),
        photos: template.photos.map((photo, i) => ({
          ...photo,
          id: photo.id || `mp-${Date.now()}-${i}`,
        })),
      }
      setMealTemplates((prev) => [newTemplate, ...prev])
      return newTemplate
    },
    []
  )

  const updateMealTemplate = useCallback((id: string, updates: Partial<MealTemplate>) => {
    setMealTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    )
  }, [])

  const duplicateMealTemplate = useCallback((id: string): MealTemplate => {
    const source = mealTemplates.find((t) => t.id === id)
    if (!source) throw new Error("Meal template not found")
    const now = new Date().toISOString()
    const duplicate: MealTemplate = {
      ...source,
      id: `mt-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isFavorite: false,
      isPublished: false,
      isArchived: false,
      lastUsedAt: undefined,
      createdAt: now,
      updatedAt: now,
      items: source.items.map((item, i) => ({
        ...item,
        id: `mti-${Date.now()}-${i}`,
      })),
      photos: source.photos.map((photo, i) => ({
        ...photo,
        id: `mp-${Date.now()}-${i}`,
      })),
    }
    setMealTemplates((prev) => [duplicate, ...prev])
    return duplicate
  }, [mealTemplates])

  const archiveMealTemplate = useCallback((id: string) => {
    setMealTemplates((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              isArchived: true,
              category: "archived",
              isPublished: false,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    )
  }, [])

  return {
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
    disableUser,
    enableUser,
    resetUserPassword,
    deleteUser,
    recordUserLogin,
  }
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const demo = useDemoLocalState()
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

  const students = dbEnabled ? (studentsQuery.data ?? []) : demo.students
  const transactions = dbEnabled ? (transactionsQuery.data ?? []) : demo.transactions
  const users = dbEnabled ? (usersQuery.data ?? []) : demo.users
  const auditLogs = dbEnabled ? (auditLogsQuery.data ?? []) : demo.auditLogs
  const calendarEvents = dbEnabled ? (calendarEventsQuery.data ?? []) : demo.calendarEvents
  const calendarSettings = dbEnabled
    ? (calendarSettingsQuery.data ?? demoCalendarSettings)
    : demo.calendarSettings
  const mealTemplates = dbEnabled ? (mealTemplatesQuery.data ?? []) : demo.mealTemplates
  const allergySubmissions = dbEnabled
    ? (allergySubmissionsQuery.data ?? [])
    : demo.allergySubmissions
  const studentProfiles = dbEnabled
    ? (studentProfilesQuery.data ?? [])
    : demo.studentProfiles
  const medicalDocuments = dbEnabled
    ? (medicalDocumentsQuery.data ?? [])
    : demo.medicalDocuments

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
      if (!dbEnabled) {
        demo.addStudent(student)
        return
      }
      await api.createStudent(student)
      invalidate("students")
    },
    [dbEnabled, demo, invalidate]
  )

  const updateStudent = useCallback(
    async (id: string, updates: Partial<Student>) => {
      if (!dbEnabled) {
        demo.updateStudent(id, updates)
        return
      }
      await api.updateStudent(id, updates)
      invalidate("students")
    },
    [dbEnabled, demo, invalidate]
  )

  const disableStudent = useCallback(
    async (id: string) => {
      if (!dbEnabled) {
        demo.disableStudent(id)
        return
      }
      await api.disableStudent(id)
      invalidate("students")
    },
    [dbEnabled, demo, invalidate]
  )

  const processMeal = useCallback(
    async (studentId: string, meal: string, amount: number, processedByUserId?: string) => {
      if (!dbEnabled) {
        return demo.processMeal(studentId, meal, amount, processedByUserId)
      }
      try {
        const tx = await api.processMeal(studentId, meal, amount, processedByUserId)
        invalidate("students", "transactions")
        return tx
      } catch {
        return null
      }
    },
    [dbEnabled, demo, invalidate]
  )

  const addFunds = useCallback(
    async (studentId: string, amount: number, performedBy?: string) => {
      if (!dbEnabled) {
        return demo.addFunds(studentId, amount, performedBy)
      }
      return null
    },
    [dbEnabled, demo]
  )

  const bulkImportStudents = useCallback(
    async (newStudents: Student[]) => {
      if (!dbEnabled) {
        demo.bulkImportStudents(newStudents)
        return
      }
      for (const student of newStudents) {
        await api.createStudent(student)
      }
      invalidate("students")
    },
    [dbEnabled, demo, invalidate]
  )

  const submitAllergyForm = useCallback(
    async (studentId: string, submittedBy: string, payload: FoodSafetyFormPayload) => {
      if (!dbEnabled) {
        return demo.submitAllergyForm(studentId, submittedBy, payload)
      }
      const submission = await api.submitAllergyForm(studentId, submittedBy, payload)
      invalidate("allergy-submissions")
      return submission
    },
    [dbEnabled, demo, invalidate]
  )

  const reviewAllergySubmission = useCallback(
    async (
      submissionId: string,
      action: "approve" | "reject" | "clarification",
      reviewedBy: string,
      reviewNote?: string
    ) => {
      if (!dbEnabled) {
        demo.reviewAllergySubmission(submissionId, action, reviewedBy, reviewNote)
        return
      }
      await api.reviewAllergySubmission(submissionId, action, reviewedBy, reviewNote)
      invalidate(
        "allergy-submissions",
        "student-profiles",
        "students",
        "audit-logs"
      )
    },
    [dbEnabled, demo, invalidate]
  )

  const uploadMedicalDocument = useCallback(
    async (
      studentId: string,
      fileName: string,
      documentUrl: string,
      uploadedBy: string
    ) => {
      if (!dbEnabled) {
        return demo.uploadMedicalDocument(studentId, fileName, documentUrl, uploadedBy)
      }
      const doc = await api.uploadMedicalDocument(studentId, fileName, documentUrl, uploadedBy)
      invalidate("medical-documents")
      return doc
    },
    [dbEnabled, demo, invalidate]
  )

  const updateParentContact = useCallback(
    async (studentId: string, contact: { name: string; email: string; phone: string }) => {
      if (!dbEnabled) {
        demo.updateParentContact(studentId, contact)
        return
      }
      await api.updateParentContact(studentId, contact)
      invalidate("students")
    },
    [dbEnabled, demo, invalidate]
  )

  const updateCalendarSettings = useCallback(
    async (updates: Partial<CalendarSettings>) => {
      if (!dbEnabled) {
        demo.updateCalendarSettings(updates)
        return
      }
      await api.updateCalendarSettings(updates)
      invalidate("calendar-settings")
    },
    [dbEnabled, demo, invalidate]
  )

  const addCalendarEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      if (!dbEnabled) {
        return demo.addCalendarEvent(event)
      }
      const created = await api.createCalendarEvent(event)
      invalidate("calendar-events")
      return created
    },
    [dbEnabled, demo, invalidate]
  )

  const updateCalendarEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      if (!dbEnabled) {
        demo.updateCalendarEvent(id, updates)
        return
      }
      await api.updateCalendarEvent(id, updates)
      invalidate("calendar-events")
    },
    [dbEnabled, demo, invalidate]
  )

  const deleteCalendarEvent = useCallback(
    async (id: string) => {
      if (!dbEnabled) {
        demo.deleteCalendarEvent(id)
        return
      }
      await api.deleteCalendarEvent(id)
      invalidate("calendar-events")
    },
    [dbEnabled, demo, invalidate]
  )

  const addMealTemplate = useCallback(
    async (template: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">) => {
      if (!dbEnabled) {
        return demo.addMealTemplate(template)
      }
      const created = await api.createMealTemplate(template)
      invalidate("meal-templates")
      return created
    },
    [dbEnabled, demo, invalidate]
  )

  const updateMealTemplate = useCallback(
    async (id: string, updates: Partial<MealTemplate>) => {
      if (!dbEnabled) {
        demo.updateMealTemplate(id, updates)
        return
      }
      await api.updateMealTemplate(id, updates)
      invalidate("meal-templates")
    },
    [dbEnabled, demo, invalidate]
  )

  const duplicateMealTemplate = useCallback(
    async (id: string) => {
      if (!dbEnabled) {
        return demo.duplicateMealTemplate(id)
      }
      const duplicate = await api.duplicateMealTemplate(id)
      invalidate("meal-templates")
      return duplicate
    },
    [dbEnabled, demo, invalidate]
  )

  const archiveMealTemplate = useCallback(
    async (id: string) => {
      if (!dbEnabled) {
        demo.archiveMealTemplate(id)
        return
      }
      await api.archiveMealTemplate(id)
      invalidate("meal-templates")
    },
    [dbEnabled, demo, invalidate]
  )

  const createUser = useCallback(
    async (input: CreateUserInput, performedBy: string) => {
      if (!dbEnabled) {
        return demo.createUser(input, performedBy)
      }
      const user = await api.createUser({ ...input, performedBy })
      invalidate("users", "audit-logs")
      return user
    },
    [dbEnabled, demo, invalidate]
  )

  const updateUser = useCallback(
    async (
      id: string,
      updates: Partial<Omit<User, "id" | "createdAt">>,
      performedBy: string,
      reason?: string
    ) => {
      if (!dbEnabled) {
        return demo.updateUser(id, updates, performedBy, reason)
      }
      const user = await api.updateUser(id, { ...updates, performedBy, reason })
      invalidate("users", "audit-logs")
      return user
    },
    [dbEnabled, demo, invalidate]
  )

  const disableUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      if (!dbEnabled) {
        return demo.disableUser(id, performedBy, reason)
      }
      await api.disableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, demo, invalidate]
  )

  const enableUser = useCallback(
    async (id: string, performedBy: string, reason?: string) => {
      if (!dbEnabled) {
        return demo.enableUser(id, performedBy, reason)
      }
      await api.enableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, demo, invalidate]
  )

  const resetUserPassword = useCallback(
    async (id: string, performedBy: string) => {
      if (!dbEnabled) {
        return demo.resetUserPassword(id, performedBy)
      }
      const result = await api.resetUserPassword(id, performedBy)
      invalidate("audit-logs")
      return result
    },
    [dbEnabled, demo, invalidate]
  )

  const deleteUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      if (!dbEnabled) {
        return demo.deleteUser(id, performedBy, reason)
      }
      await api.deleteUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [dbEnabled, demo, invalidate]
  )

  const recordUserLogin = useCallback(
    async (userId: string) => {
      if (!dbEnabled) {
        demo.recordUserLogin(userId)
        return
      }
      await api.recordUserLogin(userId)
      invalidate("users")
    },
    [dbEnabled, demo, invalidate]
  )

  const value = useMemo(
    () => ({
      databaseEnabled: dbEnabled,
      isLoading: !configLoaded || dbLoading,
      students,
      transactions,
      inventory: demo.inventory,
      notifications: demo.notifications,
      importLogs: demo.importLogs,
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
      addImportLog: demo.addImportLog,
      rollbackImport: demo.rollbackImport,
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
      demo.inventory,
      demo.notifications,
      demo.importLogs,
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
      demo.addImportLog,
      demo.rollbackImport,
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
