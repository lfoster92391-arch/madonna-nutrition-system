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

const EMPTY_STATS: TeacherDashboardStats = {
  studentsSignedUp: 0,
  payAtKiosk: 0,
  usingAccount: 0,
  usingAccountLowFunds: 0,
  prepaidOnline: 0,
}

interface TeacherDataContextValue {
  profile: TeacherProfile | null
  reservation: TeacherLunchReservation | null
  signups: StudentLunchSignupView[]
  stats: TeacherDashboardStats
  announcements: TeacherAnnouncement[]
  unreadMessageCount: number
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
    action?: "reserve" | "cancel" | "change",
    options?: { sliceCount?: number }
  ) => Promise<void>
  refreshSignups: () => Promise<void>
  setProfilePhoto: (photoUrl: string) => void
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
  const { databaseEnabled } = useDemo()
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [reservation, setReservation] = useState<TeacherLunchReservation | null>(null)
  const [signups, setSignups] = useState<StudentLunchSignupView[]>([])
  const [stats, setStats] = useState<TeacherDashboardStats>(EMPTY_STATS)
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [recentStudentIds, setRecentStudentIds] = useState<string[]>([])
  const [rememberRecent, setRememberRecentState] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentView | null>(null)
  const [searchResults, setSearchResults] = useState<TeacherStudentView[]>([])
  const [recentStudentCache, setRecentStudentCache] = useState<TeacherStudentView[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setRecentStudentIds(readRecentIds())
    setRememberRecentState(readRememberRecent())
  }, [])

  const loadFromApi = useCallback(async () => {
    if (!user) return
    try {
      const [profileRes, signupsRes, statsRes, annRes, msgRes] = await Promise.all([
        fetch(`/api/teacher/profile?teacherId=${user.id}`),
        fetch(`/api/teacher/lunch/signups?teacherId=${user.id}`),
        fetch(`/api/teacher/dashboard/stats?teacherId=${user.id}`),
        fetch(`/api/teacher/announcements?teacherId=${user.id}`),
        fetch(`/api/teacher/messages?teacherId=${user.id}`),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile ?? null)
        setReservation(data.reservation ?? null)
      }
      if (signupsRes.ok) {
        const data = await signupsRes.json()
        setSignups(data.signups ?? [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats ?? EMPTY_STATS)
      }
      if (annRes.ok) {
        const data = await annRes.json()
        setAnnouncements(data.announcements ?? [])
      }
      if (msgRes.ok) {
        const data = await msgRes.json()
        setUnreadMessageCount(
          typeof data.unreadCount === "number"
            ? data.unreadCount
            : (data.messages ?? []).filter((m: { read?: boolean }) => m.read === false).length
        )
      } else {
        setUnreadMessageCount(0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user || user.role !== "teacher") {
      setIsLoading(false)
      return
    }
    if (databaseEnabled) {
      void loadFromApi()
    } else {
      setProfile(null)
      setReservation(null)
      setSignups([])
      setStats(EMPTY_STATS)
      setAnnouncements([])
      setUnreadMessageCount(0)
      setIsLoading(false)
    }
  }, [user, databaseEnabled, loadFromApi])

  const setRememberRecent = useCallback((value: boolean) => {
    setRememberRecentState(value)
    localStorage.setItem(REMEMBER_STUDENTS_KEY, value ? "true" : "false")
  }, [])

  const addRecentStudent = useCallback(
    (student: TeacherStudentView) => {
      if (!rememberRecent) return
      setRecentStudentCache((prev) => {
        const next = [student, ...prev.filter((s) => s.id !== student.id)].slice(0, 8)
        return next
      })
      setRecentStudentIds((prev) => {
        const next = [student.id, ...prev.filter((id) => id !== student.id)].slice(0, 8)
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

      if (databaseEnabled && user) {
        const res = await fetch(
          `/api/teacher/students?teacherId=${user.id}&q=${encodeURIComponent(trimmed)}`
        )
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.students ?? [])
          return
        }
      }

      setSearchResults([])
    },
    [databaseEnabled, user]
  )

  const selectStudent = useCallback(
    async (studentId: string) => {
      if (databaseEnabled && user) {
        const res = await fetch(`/api/teacher/students/${studentId}?teacherId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setSelectedStudent(data.student)
          addRecentStudent(data.student)
          return
        }
      }
      setSelectedStudent(null)
    },
    [databaseEnabled, user, addRecentStudent]
  )

  const clearRecentStudents = useCallback(() => {
    setRecentStudentIds([])
    setRecentStudentCache([])
    localStorage.removeItem(RECENT_STUDENTS_KEY)
  }, [])

  const confirmStudentLunch = useCallback(
    async (studentId: string, paymentMethod: TeacherPaymentMethod) => {
      if (!databaseEnabled || !user) return
      const res = await fetch("/api/teacher/lunch/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: user.id, studentId, paymentMethod }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? "Unable to sign up student")
      }
      await loadFromApi()
    },
    [databaseEnabled, user, loadFromApi]
  )

  const updateTeacherReservation = useCallback(
    async (
      paymentMethod: TeacherPaymentMethod,
      action: "reserve" | "cancel" | "change" = "reserve",
      options?: { sliceCount?: number }
    ) => {
      if (!databaseEnabled || !user) return
      await fetch("/api/teacher/lunch/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: user.id,
          paymentMethod,
          action,
          ...(options?.sliceCount != null ? { sliceCount: options.sliceCount } : {}),
        }),
      })
      await loadFromApi()
    },
    [databaseEnabled, user, loadFromApi]
  )

  const refreshSignups = useCallback(async () => {
    if (databaseEnabled && user) {
      await loadFromApi()
    }
  }, [databaseEnabled, user, loadFromApi])

  const setProfilePhoto = useCallback((photoUrl: string) => {
    setProfile((prev) => (prev ? { ...prev, photoUrl } : prev))
  }, [])

  const value = useMemo(
    () => ({
      profile,
      reservation,
      signups,
      stats,
      announcements,
      unreadMessageCount,
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
      setProfilePhoto,
    }),
    [
      profile,
      reservation,
      signups,
      stats,
      announcements,
      unreadMessageCount,
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
      setProfilePhoto,
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
  allStudents: TeacherStudentView[] = []
): TeacherStudentView[] {
  return recentIds
    .map((id) => allStudents.find((s) => s.id === id))
    .filter((s): s is TeacherStudentView => Boolean(s))
}
