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
  demoImportLogs,
  demoInventory,
  demoMedicalDocuments,
  demoNotifications,
  demoStudentProfiles,
  demoStudents,
  demoTransactions,
} from "@/data/demo"
import { addOneYear, payloadToAllergies } from "@/lib/food-safety"
import type {
  AllergySubmission,
  AllergySubmissionStatus,
  AuditLogEntry,
  FoodSafetyFormPayload,
  ImportLog,
  InventoryItem,
  MedicalDocument,
  Notification,
  Student,
  StudentProfile,
  Transaction,
} from "@/lib/types"

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
    ]
  )

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error("useDemo must be used within DemoProvider")
  return ctx
}
