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
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  demoStudentLunchSignups,
  demoTeacherAnnouncements,
  demoTeacherDashboardStats,
  demoTeacherLunchReservation,
  demoTeacherProfile,
  demoTeacherRecentStudentIds,
  teacherPortalStudents,
} from "@/data/demo/teacher"
import { mapStudentForTeacher } from "@/lib/teacher/privacy"
import type {
  StudentLunchSignupView,
  TeacherAnnouncement,
  TeacherDashboardStats,
  TeacherLunchReservation,
  TeacherPaymentMethod,
  TeacherProfile,
  TeacherStudentView,
} from "@/lib/teacher/types"

const RECENT_STUDENTS_KEY = "mnms-teacher-recent-students"
const REMEMBER_STUDENTS_KEY = "mnms-teacher-remember-students"

interface TeacherDataContextValue {
  profile: TeacherProfile | null
  reservation: TeacherLunchReservation | null
  signups: StudentLunchSignupView[]
  stats: TeacherDashboardStats
  announcements: TeacherAnnouncement[]
  recentStudentIds: string[]
  rememberRecent: boolean
  selectedStudent: TeacherStudentView | null
  searchResults: TeacherStudentView[]
  isLoading: boolean
  setRememberRecent: (value: boolean) => void
  searchStudents: (query: string) => void
  selectStudent: (studentId: string) => void
  clearRecentStudents: () => void
  confirmStudentLunch: (studentId: string, paymentMethod: TeacherPaymentMethod) => Promise<void>
  updateTeacherReservation: (
    paymentMethod: TeacherPaymentMethod,
    action?: "reserve" | "cancel" | "change"
  ) => Promise<void>
  refreshSignups: () => Promise<void>
}

const TeacherDataContext = createContext<TeacherDataContextValue | null>(null)

function readRecentIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_STUDENTS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function readRememberRecent(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(REMEMBER_STUDENTS_KEY) !== "false"
}

export function TeacherDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { databaseEnabled, demoPreviewActive, users } = useDemo()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [reservation, setReservation] = useState<TeacherLunchReservation | null>(
    demoTeacherLunchReservation
  )
  const [signups, setSignups] = useState<StudentLunchSignupView[]>(demoStudentLunchSignups)
  const [stats, setStats] = useState<TeacherDashboardStats>(demoTeacherDashboardStats)
  const [announcements, setAnnouncements] =
    useState<TeacherAnnouncement[]>([])
  const [recentStudentIds, setRecentStudentIds] = useState<string[]>(demoTeacherRecentStudentIds)
  const [rememberRecent, setRememberRecentState] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentView | null>(null)
  const [searchResults, setSearchResults] = useState<TeacherStudentView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const demoUser = useMemo(
    () => users.find((u) => u.id === user?.id),
    [users, user?.id]
  )

  useEffect(() => {
    setRecentStudentIds(readRecentIds())
    setRememberRecentState(readRememberRecent())
  }, [])

  const loadDemoData = useCallback(() => {
    if (!user) return
    setProfile({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      department: demoUser?.department ?? demoTeacherProfile.department,
      accountBalance: demoUser?.accountBalance ?? demoTeacherProfile.accountBalance,
      photoUrl: demoTeacherProfile.photoUrl,
    })
    setReservation(demoTeacherLunchReservation)
    setSignups(demoStudentLunchSignups)
    setStats(demoTeacherDashboardStats)
    setAnnouncements(demoTeacherAnnouncements)
    setIsLoading(false)
  }, [user, demoUser])

  const loadFromApi = useCallback(async () => {
    if (!user) return
    try {
      const [profileRes, signupsRes, statsRes, annRes] = await Promise.all([
        fetch(`/api/teacher/profile?teacherId=${user.id}`),
        fetch(`/api/teacher/lunch/signups?teacherId=${user.id}`),
        fetch(`/api/teacher/dashboard/stats?teacherId=${user.id}`),
        fetch(`/api/teacher/announcements?teacherId=${user.id}`),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile({ ...data.profile, photoUrl: demoTeacherProfile.photoUrl })
        setReservation(data.reservation ?? demoTeacherLunchReservation)
      }
      if (signupsRes.ok) {
        const data = await signupsRes.json()
        setSignups(data.signups)
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
      if (annRes.ok) {
        const data = await annRes.json()
        setAnnouncements(data.announcements)
      }
    } catch {
      loadDemoData()
    } finally {
      setIsLoading(false)
    }
  }, [user, loadDemoData])

  useEffect(() => {
    if (!user || user.role !== "teacher") {
      setIsLoading(false)
      return
    }
    if (databaseEnabled && !demoPreviewActive) {
      void loadFromApi()
    } else if (demoPreviewActive) {
      loadDemoData()
    } else {
      setProfile(null)
      setReservation(null)
      setSignups([])
      setStats({
        studentsSignedUp: 0,
        payAtKiosk: 0,
        usingAccount: 0,
        usingAccountLowFunds: 0,
        prepaidOnline: 0,
      })
      setAnnouncements([])
      setIsLoading(false)
    }
  }, [user, databaseEnabled, demoPreviewActive, loadDemoData, loadFromApi])

  const setRememberRecent = useCallback((value: boolean) => {
    setRememberRecentState(value)
    localStorage.setItem(REMEMBER_STUDENTS_KEY, value ? "true" : "false")
  }, [])

  const addRecentStudent = useCallback(
    (studentId: string) => {
      if (!rememberRecent) return
      setRecentStudentIds((prev) => {
        const next = [studentId, ...prev.filter((id) => id !== studentId)].slice(0, 8)
        localStorage.setItem(RECENT_STUDENTS_KEY, JSON.stringify(next))
        return next
      })
    },
    [rememberRecent]
  )

  const searchStudents = useCallback(
    async (query: string) => {
      const trimmed = query.trim().toLowerCase()
      if (!trimmed) {
        setSearchResults([])
        return
      }

      if (databaseEnabled && !demoPreviewActive && user) {
        const res = await fetch(
          `/api/teacher/students?teacherId=${user.id}&q=${encodeURIComponent(trimmed)}`
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.students)
          return
        }
      }

      const matches = teacherPortalStudents
        .filter(
          (s) =>
            s.id.toLowerCase().includes(trimmed) ||
            s.firstName.toLowerCase().includes(trimmed) ||
            s.lastName.toLowerCase().includes(trimmed) ||
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(trimmed)
        )
        .map(mapStudentForTeacher)
      setSearchResults(matches)
    },
    [databaseEnabled, demoPreviewActive, user]
  )

  const selectStudent = useCallback(
    async (studentId: string) => {
      if (databaseEnabled && !demoPreviewActive && user) {
        const res = await fetch(`/api/teacher/students/${studentId}?teacherId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedStudent(data.student)
          addRecentStudent(studentId)
          return
        }
      }

      const student = teacherPortalStudents.find((s) => s.id === studentId)
      if (student) {
        setSelectedStudent(mapStudentForTeacher(student))
        addRecentStudent(studentId)
      }
    },
    [databaseEnabled, demoPreviewActive, user, addRecentStudent]
  )

  const clearRecentStudents = useCallback(() => {
    setRecentStudentIds([])
    localStorage.removeItem(RECENT_STUDENTS_KEY)
  }, [])

  const confirmStudentLunch = useCallback(
    async (studentId: string, paymentMethod: TeacherPaymentMethod) => {
      if (databaseEnabled && !demoPreviewActive && user) {
        await fetch("/api/teacher/lunch/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId: user.id, studentId, paymentMethod }),
        })
        await loadFromApi()
        return
      }

      const student = teacherPortalStudents.find((s) => s.id === studentId)
      if (!student) return

      const existing = signups.find((s) => s.studentId === studentId)
      const status =
        paymentMethod === "pay_at_kiosk"
          ? "pay_at_kiosk"
          : paymentMethod === "prepay_online"
            ? "prepaid"
            : student.balance < 5.25
              ? "low_funds"
              : "using_account"

      const row: StudentLunchSignupView = {
        id: existing?.id ?? `sls-${Date.now()}`,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        photo: student.photo,
        grade: student.grade,
        paymentMethod,
        status,
        signedUpAt: new Date().toISOString(),
      }

      setSignups((prev) => {
        const filtered = prev.filter((s) => s.studentId !== studentId)
        return [row, ...filtered]
      })
      setStats((prev) => ({
        ...prev,
        studentsSignedUp: prev.studentsSignedUp + (existing ? 0 : 1),
      }))
      addRecentStudent(studentId)
    },
    [databaseEnabled, demoPreviewActive, user, signups, loadFromApi, addRecentStudent]
  )

  const updateTeacherReservation = useCallback(
    async (paymentMethod: TeacherPaymentMethod, action: "reserve" | "cancel" | "change" = "reserve") => {
      if (databaseEnabled && !demoPreviewActive && user) {
        await fetch("/api/teacher/lunch/reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId: user.id, paymentMethod, action }),
        })
        await loadFromApi()
        return
      }

      if (action === "cancel") {
        setReservation((prev) => (prev ? { ...prev, status: "cancelled" } : null))
        return
      }

      setReservation({
        ...demoTeacherLunchReservation,
        paymentMethod,
        status: "reserved",
      })
    },
    [databaseEnabled, demoPreviewActive, user, loadFromApi]
  )

  const refreshSignups = useCallback(async () => {
    if (databaseEnabled && !demoPreviewActive && user) {
      await loadFromApi()
    }
  }, [databaseEnabled, demoPreviewActive, user, loadFromApi])

  const value = useMemo(
    () => ({
      profile,
      reservation,
      signups,
      stats,
      announcements,
      recentStudentIds,
      rememberRecent,
      selectedStudent,
      searchResults,
      isLoading,
      setRememberRecent,
      searchStudents,
      selectStudent,
      clearRecentStudents,
      confirmStudentLunch,
      updateTeacherReservation,
      refreshSignups,
    }),
    [
      profile,
      reservation,
      signups,
      stats,
      announcements,
      recentStudentIds,
      rememberRecent,
      selectedStudent,
      searchResults,
      isLoading,
      setRememberRecent,
      searchStudents,
      selectStudent,
      clearRecentStudents,
      confirmStudentLunch,
      updateTeacherReservation,
      refreshSignups,
    ]
  )

  return <TeacherDataContext.Provider value={value}>{children}</TeacherDataContext.Provider>
}

export function useTeacherData() {
  const ctx = useContext(TeacherDataContext)
  if (!ctx) throw new Error("useTeacherData must be used within TeacherDataProvider")
  return ctx
}

export function getRecentStudents(
  recentIds: string[],
  allStudents = teacherPortalStudents
): TeacherStudentView[] {
  return recentIds
    .map((id) => allStudents.find((s) => s.id === id))
    .filter((s): s is (typeof teacherPortalStudents)[number] => Boolean(s))
    .map(mapStudentForTeacher)
}
