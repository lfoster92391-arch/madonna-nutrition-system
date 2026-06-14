"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  demoAllergySubmissions,
  demoAuditLogs,
  demoCalendarEvents,
  demoCalendarSettings,
  demoImportLogs,
  demoInventory,
  demoMedicalDocuments,
  demoNotifications,
  demoStudentProfiles,
  demoStudents,
  demoTransactions,
  demoUsers,
} from "@/data/demo"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import { generateTempPassword } from "@/lib/users"
import type {
  AllergySubmission,
  AllergySubmissionStatus,
  AuditLogEntry,
  CalendarEvent,
  CalendarSettings,
  FoodSafetyFormPayload,
  ImportLog,
  InventoryItem,
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
  linkedStudentIds?: string[]
}

interface DemoContextValue {
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
  users: User[]
  addStudent: (student: Student) => void
  updateStudent: (id: string, updates: Partial<Student>) => void
  disableStudent: (id: string) => void
  processMeal: (studentId: string, meal: string, amount: number) => Transaction | null
  addImportLog: (log: ImportLog) => void
  rollbackImport: (logId: string) => void
  bulkImportStudents: (newStudents: Student[]) => void
  submitAllergyForm: (
    studentId: string,
    submittedBy: string,
    payload: FoodSafetyFormPayload
  ) => AllergySubmission
  reviewAllergySubmission: (
    submissionId: string,
    action: "approve" | "reject" | "clarification",
    reviewedBy: string,
    reviewNote?: string
  ) => void
  uploadMedicalDocument: (
    studentId: string,
    fileName: string,
    documentUrl: string,
    uploadedBy: string
  ) => MedicalDocument
  updateParentContact: (
    studentId: string,
    contact: { name: string; email: string; phone: string }
  ) => void
  getStudentProfile: (studentId: string) => StudentProfile | undefined
  updateCalendarSettings: (updates: Partial<CalendarSettings>) => void
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => CalendarEvent
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteCalendarEvent: (id: string) => void
  getUserByUsername: (username: string) => User | undefined
  createUser: (input: CreateUserInput, performedBy: string) => User
  updateUser: (
    id: string,
    updates: Partial<Omit<User, "id" | "createdAt">>,
    performedBy: string,
    reason?: string
  ) => User | null
  disableUser: (id: string, performedBy: string, reason: string) => boolean
  enableUser: (id: string, performedBy: string, reason?: string) => boolean
  resetUserPassword: (id: string, performedBy: string) => { tempPassword: string } | null
  deleteUser: (id: string, performedBy: string, reason: string) => boolean
  recordUserLogin: (userId: string) => void
}

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
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
    (username: string) => {
      const normalized = username.trim().toLowerCase()
      const aliases: Record<string, string> = {
        parent: "sarah.anderson",
        admin: "d.garcia",
        cashier: "j.wilson",
      }
      const lookup = aliases[normalized] ?? normalized
      return users.find(
        (u) =>
          u.username.toLowerCase() === lookup || u.email.toLowerCase() === lookup
      )
    },
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
              linkedStudentIds: previous.linkedStudentIds,
            },
            newValue: {
              firstName: updated.firstName,
              lastName: updated.lastName,
              email: updated.email,
              role: updated.role,
              phone: updated.phone,
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
        metadata: {
          method: "temp_password",
          clerkReady: true,
          resetSent: true,
        },
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
    (studentId: string, meal: string, amount: number): Transaction | null => {
      const student = students.find((s) => s.id === studentId && !s.disabled)
      if (!student) return null

      const balanceAfter = student.balance - amount
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        meal,
        amount,
        balanceAfter,
        timestamp: new Date().toISOString(),
      }

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, balance: balanceAfter } : s))
      )
      setTransactions((prev) => [tx, ...prev])
      return tx
    },
    [students]
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
      let status: AllergySubmissionStatus =
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

  const value = useMemo(
    () => ({
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
      users,
      addStudent,
      updateStudent,
      disableStudent,
      processMeal,
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
      users,
      addStudent,
      updateStudent,
      disableStudent,
      processMeal,
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
