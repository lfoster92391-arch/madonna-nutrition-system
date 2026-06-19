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
import {
  readDemoPreview,
  subscribeDemoPreview,
  writeDemoPreview,
} from "@/lib/demo/session"
import { resetDemoOperationsStore } from "@/lib/operations/demo-store"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import { generateTempPassword, findUserByLogin, assertCanChangeUserRole, formatRoleChangeReason, userRoleSupportsBadge } from "@/lib/users"
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
  demoPreviewActive: boolean
  activateDemoPreview: () => void
  deactivateDemoPreview: () => void
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
    (input: CreateUserInput, performedBy: string): CreateUserResult => {
      const now = new Date().toISOString()
      const useGenerated = input.generateTempPassword ?? !input.password
      const password = input.password ?? (useGenerated ? generateTempPassword() : undefined)
      const forcePasswordChange = input.forcePasswordChange ?? useGenerated
      const user: User = {
        id: `usr-${Date.now()}`,
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        phone: input.phone,
        badgeId: input.badgeId,
        linkedStudentIds: input.linkedStudentIds,
        status: "active",
        mustChangePassword: forcePasswordChange,
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
          passwordSet: Boolean(password),
          forcePasswordChange,
        },
      })
      return { ...user, tempPassword: useGenerated ? password : undefined }
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

  const updateUserRole = useCallback(
    (id: string, role: UserRole, performedBy: string, _adminUserId: string): User => {
      const target = users.find((u) => u.id === id)
      if (!target) throw new Error("User not found")

      const conflict = assertCanChangeUserRole(users, target.role, role)
      if (conflict) throw new Error(conflict)
      if (target.role === role) return target

      const previousRole = target.role
      const reason = formatRoleChangeReason(previousRole, role)
      let updated: User = target

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u
          updated = {
            ...u,
            role,
            badgeId: userRoleSupportsBadge(role) ? u.badgeId : undefined,
            linkedStudentIds: role === "parent" ? u.linkedStudentIds : [],
            updatedAt: new Date().toISOString(),
          }
          return updated
        })
      )

      appendAuditLog({
        action: "ROLE_CHANGED",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        reason,
        previousValue: { role: previousRole },
        newValue: { role },
      })

      return updated
    },
    [appendAuditLog, users]
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
    (id: string, performedBy: string, options?: ResetPasswordInput): ResetPasswordResult => {
      const target = users.find((u) => u.id === id)
      if (!target) return null
      const useGenerated = options?.generateTempPassword ?? !options?.password
      const password = options?.password ?? (useGenerated ? generateTempPassword() : undefined)
      const forcePasswordChange = options?.forcePasswordChange ?? useGenerated
      if (forcePasswordChange) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, mustChangePassword: true, updatedAt: new Date().toISOString() } : u
          )
        )
      }
      appendAuditLog({
        action: "PASSWORD_RESET",
        entity: "user",
        entityType: "user",
        entityId: id,
        performedBy,
        reason: options?.reason,
        metadata: {
          method: useGenerated ? "generated" : "custom",
          forcePasswordChange,
          targetUsername: target.username,
          targetRole: target.role,
        },
        newValue: { resetSent: true, forcePasswordChange },
      })
      return {
        tempPassword: useGenerated ? password : undefined,
        forcePasswordChange,
      }
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
        processedByName: cashier ? `${cashier.firstName} ${cashier.lastName}` : "Station",
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
            const payload = submission.changePayload
            const updated: StudentProfile = {
              studentId: submission.studentId,
              dietaryRestrictions: dietary,
              allergyVerified: true,
              allergyReviewedAt: now,
              allergyExpiresAt: addOneYear(new Date(now)),
              updateRequestedAt: null,
              medicalNotes: payload.medicalNotes ?? payload.reactionInfo ?? existing?.medicalNotes ?? null,
              emergencyFoodContactName:
                payload.emergencyFoodContactName ?? existing?.emergencyFoodContactName ?? null,
              emergencyFoodContactPhone:
                payload.emergencyFoodContactPhone ?? existing?.emergencyFoodContactPhone ?? null,
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
    updateUserRole,
    disableUser,
    enableUser,
    resetUserPassword,
    deleteUser,
    recordUserLogin,
  }
}

const EMPTY_IMPORT_LOGS: ImportLog[] = []

export function DemoProvider({ children }: { children: ReactNode }) {
  const demo = useDemoLocalState()
  const queryClient = useQueryClient()
  const [dbEnabled, setDbEnabled] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [demoPreviewActive, setDemoPreviewActive] = useState(false)

  useEffect(() => {
    setDemoPreviewActive(readDemoPreview())
    return subscribeDemoPreview(setDemoPreviewActive)
  }, [])

  const activateDemoPreview = useCallback(() => {
    writeDemoPreview(true)
    setDemoPreviewActive(true)
    resetDemoOperationsStore()
  }, [])

  const deactivateDemoPreview = useCallback(() => {
    writeDemoPreview(false)
    setDemoPreviewActive(false)
  }, [])

  useEffect(() => {
    api
      .getConfig()
      .then((config) => setDbEnabled(config.databaseEnabled))
      .catch(() => setDbEnabled(false))
      .finally(() => setConfigLoaded(true))
  }, [])

  const useLiveData = dbEnabled && !demoPreviewActive

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
    enabled: useLiveData,
  })
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: api.getTransactions,
    enabled: useLiveData,
  })
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
    enabled: useLiveData,
  })
  const auditLogsQuery = useQuery({
    queryKey: ["audit-logs"],
    queryFn: api.getAuditLogs,
    enabled: useLiveData,
  })
  const calendarEventsQuery = useQuery({
    queryKey: ["calendar-events"],
    queryFn: api.getCalendarEvents,
    enabled: useLiveData,
  })
  const calendarSettingsQuery = useQuery({
    queryKey: ["calendar-settings"],
    queryFn: api.getCalendarSettings,
    enabled: useLiveData,
  })
  const mealTemplatesQuery = useQuery({
    queryKey: ["meal-templates"],
    queryFn: api.getMealTemplates,
    enabled: useLiveData,
  })
  const allergySubmissionsQuery = useQuery({
    queryKey: ["allergy-submissions"],
    queryFn: api.getAllergySubmissions,
    enabled: useLiveData,
  })
  const studentProfilesQuery = useQuery({
    queryKey: ["student-profiles"],
    queryFn: api.getStudentProfiles,
    enabled: useLiveData,
  })
  const medicalDocumentsQuery = useQuery({
    queryKey: ["medical-documents"],
    queryFn: api.getMedicalDocuments,
    enabled: useLiveData,
  })

  const dbLoading =
    useLiveData &&
    (studentsQuery.isLoading ||
      transactionsQuery.isLoading ||
      usersQuery.isLoading ||
      auditLogsQuery.isLoading)

  const students = useLiveData ? (studentsQuery.data ?? []) : demoPreviewActive ? demo.students : []
  const transactions = useLiveData
    ? (transactionsQuery.data ?? [])
    : demoPreviewActive
      ? demo.transactions
      : []
  const users = useLiveData ? (usersQuery.data ?? []) : demoPreviewActive ? demo.users : []
  const auditLogs = useLiveData ? (auditLogsQuery.data ?? []) : demoPreviewActive ? demo.auditLogs : []
  const calendarEvents = useLiveData
    ? (calendarEventsQuery.data ?? [])
    : demoPreviewActive
      ? demo.calendarEvents
      : []
  const calendarSettings = useLiveData
    ? (calendarSettingsQuery.data ?? demoCalendarSettings)
    : demoPreviewActive
      ? demo.calendarSettings
      : demoCalendarSettings
  const mealTemplates = useLiveData
    ? (mealTemplatesQuery.data ?? [])
    : demoPreviewActive
      ? demo.mealTemplates
      : []
  const allergySubmissions = useLiveData
    ? (allergySubmissionsQuery.data ?? [])
    : demoPreviewActive
      ? demo.allergySubmissions
      : []
  const studentProfiles = useLiveData
    ? (studentProfilesQuery.data ?? [])
    : demoPreviewActive
      ? demo.studentProfiles
      : []
  const medicalDocuments = useLiveData
    ? (medicalDocumentsQuery.data ?? [])
    : demoPreviewActive
      ? demo.medicalDocuments
      : []
  const inventory = demoPreviewActive ? demo.inventory : []
  const notifications = demoPreviewActive ? demo.notifications : []
  const importLogs = demoPreviewActive ? demo.importLogs : EMPTY_IMPORT_LOGS

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
      if (!useLiveData) {
        demo.addStudent(student)
        return
      }
      await api.createStudent(student)
      invalidate("students")
    },
    [useLiveData, demo, invalidate]
  )

  const updateStudent = useCallback(
    async (id: string, updates: Partial<Student>) => {
      if (!useLiveData) {
        demo.updateStudent(id, updates)
        return
      }
      await api.updateStudent(id, updates)
      invalidate("students")
    },
    [useLiveData, demo, invalidate]
  )

  const disableStudent = useCallback(
    async (id: string) => {
      if (!useLiveData) {
        demo.disableStudent(id)
        return
      }
      await api.disableStudent(id)
      invalidate("students")
    },
    [useLiveData, demo, invalidate]
  )

  const processMeal = useCallback(
    async (studentId: string, meal: string, amount: number, processedByUserId?: string) => {
      if (!useLiveData) {
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
    [useLiveData, demo, invalidate]
  )

  const addFunds = useCallback(
    async (studentId: string, amount: number, performedBy?: string) => {
      if (!useLiveData) {
        return demo.addFunds(studentId, amount, performedBy)
      }
      return null
    },
    [useLiveData, demo]
  )

  const bulkImportStudents = useCallback(
    async (newStudents: Student[]) => {
      if (!useLiveData) {
        demo.bulkImportStudents(newStudents)
        return
      }
      for (const student of newStudents) {
        await api.createStudent(student)
      }
      invalidate("students")
    },
    [useLiveData, demo, invalidate]
  )

  const submitAllergyForm = useCallback(
    async (studentId: string, submittedBy: string, payload: FoodSafetyFormPayload) => {
      if (!useLiveData) {
        return demo.submitAllergyForm(studentId, submittedBy, payload)
      }
      const submission = await api.submitAllergyForm(studentId, submittedBy, payload)
      invalidate("allergy-submissions")
      return submission
    },
    [useLiveData, demo, invalidate]
  )

  const reviewAllergySubmission = useCallback(
    async (
      submissionId: string,
      action: "approve" | "reject" | "clarification",
      reviewedBy: string,
      reviewNote?: string
    ) => {
      if (!useLiveData) {
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
    [useLiveData, demo, invalidate]
  )

  const uploadMedicalDocument = useCallback(
    async (
      studentId: string,
      fileName: string,
      documentUrl: string,
      uploadedBy: string
    ) => {
      if (!useLiveData) {
        return demo.uploadMedicalDocument(studentId, fileName, documentUrl, uploadedBy)
      }
      const doc = await api.uploadMedicalDocument(studentId, fileName, documentUrl, uploadedBy)
      invalidate("medical-documents")
      return doc
    },
    [useLiveData, demo, invalidate]
  )

  const updateParentContact = useCallback(
    async (studentId: string, contact: { name: string; email: string; phone: string }) => {
      if (!useLiveData) {
        demo.updateParentContact(studentId, contact)
        return
      }
      await api.updateParentContact(studentId, contact)
      invalidate("students")
    },
    [useLiveData, demo, invalidate]
  )

  const updateCalendarSettings = useCallback(
    async (updates: Partial<CalendarSettings>) => {
      if (!useLiveData) {
        demo.updateCalendarSettings(updates)
        return
      }
      await api.updateCalendarSettings(updates)
      invalidate("calendar-settings")
    },
    [useLiveData, demo, invalidate]
  )

  const addCalendarEvent = useCallback(
    async (event: Omit<CalendarEvent, "id">) => {
      if (!useLiveData) {
        return demo.addCalendarEvent(event)
      }
      const created = await api.createCalendarEvent(event)
      invalidate("calendar-events")
      return created
    },
    [useLiveData, demo, invalidate]
  )

  const updateCalendarEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      if (!useLiveData) {
        demo.updateCalendarEvent(id, updates)
        return
      }
      await api.updateCalendarEvent(id, updates)
      invalidate("calendar-events")
    },
    [useLiveData, demo, invalidate]
  )

  const deleteCalendarEvent = useCallback(
    async (id: string) => {
      if (!useLiveData) {
        demo.deleteCalendarEvent(id)
        return
      }
      await api.deleteCalendarEvent(id)
      invalidate("calendar-events")
    },
    [useLiveData, demo, invalidate]
  )

  const addMealTemplate = useCallback(
    async (template: Omit<MealTemplate, "id" | "createdAt" | "updatedAt">) => {
      if (!useLiveData) {
        return demo.addMealTemplate(template)
      }
      const created = await api.createMealTemplate(template)
      invalidate("meal-templates")
      return created
    },
    [useLiveData, demo, invalidate]
  )

  const updateMealTemplate = useCallback(
    async (id: string, updates: Partial<MealTemplate>) => {
      if (!useLiveData) {
        demo.updateMealTemplate(id, updates)
        return
      }
      await api.updateMealTemplate(id, updates)
      invalidate("meal-templates")
    },
    [useLiveData, demo, invalidate]
  )

  const duplicateMealTemplate = useCallback(
    async (id: string) => {
      if (!useLiveData) {
        return demo.duplicateMealTemplate(id)
      }
      const duplicate = await api.duplicateMealTemplate(id)
      invalidate("meal-templates")
      return duplicate
    },
    [useLiveData, demo, invalidate]
  )

  const archiveMealTemplate = useCallback(
    async (id: string) => {
      if (!useLiveData) {
        demo.archiveMealTemplate(id)
        return
      }
      await api.archiveMealTemplate(id)
      invalidate("meal-templates")
    },
    [useLiveData, demo, invalidate]
  )

  const createUser = useCallback(
    async (input: CreateUserInput, performedBy: string) => {
      if (!useLiveData) {
        return demo.createUser(input, performedBy)
      }
      const result = await api.adminCreateUser({ ...input, performedBy })
      invalidate("users", "audit-logs")
      return { ...result.user, tempPassword: result.tempPassword }
    },
    [useLiveData, demo, invalidate]
  )

  const updateUser = useCallback(
    async (
      id: string,
      updates: Partial<Omit<User, "id" | "createdAt">>,
      performedBy: string,
      reason?: string
    ) => {
      if (!useLiveData) {
        return demo.updateUser(id, updates, performedBy, reason)
      }
      const user = await api.updateUser(id, { ...updates, performedBy, reason })
      invalidate("users", "audit-logs")
      return user
    },
    [useLiveData, demo, invalidate]
  )

  const updateUserRole = useCallback(
    async (id: string, role: UserRole, performedBy: string, adminUserId: string) => {
      if (!useLiveData) {
        return demo.updateUserRole(id, role, performedBy, adminUserId)
      }
      const user = await api.updateUserRole(id, { role, adminUserId, performedBy })
      invalidate("users", "audit-logs")
      return user
    },
    [useLiveData, demo, invalidate]
  )

  const disableUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      if (!useLiveData) {
        return demo.disableUser(id, performedBy, reason)
      }
      await api.disableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [useLiveData, demo, invalidate]
  )

  const enableUser = useCallback(
    async (id: string, performedBy: string, reason?: string) => {
      if (!useLiveData) {
        return demo.enableUser(id, performedBy, reason)
      }
      await api.enableUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [useLiveData, demo, invalidate]
  )

  const resetUserPassword = useCallback(
    async (id: string, performedBy: string, options?: ResetPasswordInput) => {
      if (!useLiveData) {
        return demo.resetUserPassword(id, performedBy, options)
      }
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
    [useLiveData, demo, invalidate]
  )

  const deleteUser = useCallback(
    async (id: string, performedBy: string, reason: string) => {
      if (!useLiveData) {
        return demo.deleteUser(id, performedBy, reason)
      }
      await api.deleteUser(id, performedBy, reason)
      invalidate("users", "audit-logs")
      return true
    },
    [useLiveData, demo, invalidate]
  )

  const recordUserLogin = useCallback(
    async (userId: string) => {
      if (!useLiveData) {
        demo.recordUserLogin(userId)
        return
      }
      await api.recordUserLogin(userId)
      invalidate("users")
    },
    [useLiveData, demo, invalidate]
  )

  const value = useMemo(
    () => ({
      databaseEnabled: dbEnabled,
      demoPreviewActive,
      activateDemoPreview,
      deactivateDemoPreview,
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
      updateUserRole,
      disableUser,
      enableUser,
      resetUserPassword,
      deleteUser,
      recordUserLogin,
    }),
    [
      dbEnabled,
      demoPreviewActive,
      activateDemoPreview,
      deactivateDemoPreview,
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
