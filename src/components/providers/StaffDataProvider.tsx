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
import type { StaffAnnouncement, StaffProfile } from "@/lib/staff/types"

interface StaffDataContextValue {
  profile: StaffProfile | null
  announcements: StaffAnnouncement[]
  unreadMessageCount: number
  isLoading: boolean
  refreshProfile: () => Promise<void>
  setProfilePhoto: (photoUrl: string) => void
}

const StaffDataContext = createContext<StaffDataContextValue | null>(null)

export function StaffDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [profile, setProfile] = useState<StaffProfile | null>(null)
  const [announcements, setAnnouncements] = useState<StaffAnnouncement[]>([])
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadFromApi = useCallback(async () => {
    if (!user) return
    try {
      const [profileRes, annRes, msgRes] = await Promise.all([
        fetch(`/api/staff/profile?staffId=${user.id}`),
        fetch(`/api/staff/announcements?staffId=${user.id}`),
        fetch(`/api/staff/messages?staffId=${user.id}`),
      ])

      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile ?? null)
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
    if (!user || user.role !== "staff") {
      setIsLoading(false)
      return
    }
    if (databaseEnabled) {
      void loadFromApi()
    } else {
      setProfile(null)
      setAnnouncements([])
      setUnreadMessageCount(0)
      setIsLoading(false)
    }
  }, [user, databaseEnabled, loadFromApi])

  const setProfilePhoto = useCallback((photoUrl: string) => {
    setProfile((prev) => (prev ? { ...prev, photoUrl } : prev))
  }, [])

  const value = useMemo(
    () => ({
      profile,
      announcements,
      unreadMessageCount,
      isLoading,
      refreshProfile: loadFromApi,
      setProfilePhoto,
    }),
    [profile, announcements, unreadMessageCount, isLoading, loadFromApi, setProfilePhoto]
  )

  return <StaffDataContext.Provider value={value}>{children}</StaffDataContext.Provider>
}

export function useStaffData() {
  const ctx = useContext(StaffDataContext)
  if (!ctx) throw new Error("useStaffData must be used within StaffDataProvider")
  return ctx
}
