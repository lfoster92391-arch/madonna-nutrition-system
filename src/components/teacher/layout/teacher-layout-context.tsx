"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { TEACHER_RAIL_STORAGE_KEY } from "@/components/teacher/layout/teacher-theme"

type TeacherLayoutContextValue = {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  mobileRailOpen: boolean
  setMobileRailOpen: (open: boolean) => void
  utilityRailExpanded: boolean
  setUtilityRailExpanded: (open: boolean) => void
  toggleUtilityRail: () => void
}

const TeacherLayoutContext = createContext<TeacherLayoutContextValue | null>(null)

export function TeacherLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)
  const [utilityRailExpanded, setUtilityRailExpandedState] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TEACHER_RAIL_STORAGE_KEY)
    if (stored !== null) setUtilityRailExpandedState(stored === "true")
  }, [])

  const setUtilityRailExpanded = useCallback((open: boolean) => {
    setUtilityRailExpandedState(open)
    localStorage.setItem(TEACHER_RAIL_STORAGE_KEY, String(open))
  }, [])

  const toggleUtilityRail = useCallback(() => {
    setUtilityRailExpandedState((prev) => {
      const next = !prev
      localStorage.setItem(TEACHER_RAIL_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return (
    <TeacherLayoutContext.Provider
      value={{
        mobileSidebarOpen,
        setMobileSidebarOpen,
        mobileRailOpen,
        setMobileRailOpen,
        utilityRailExpanded,
        setUtilityRailExpanded,
        toggleUtilityRail,
      }}
    >
      {children}
    </TeacherLayoutContext.Provider>
  )
}

export function useTeacherLayout() {
  const ctx = useContext(TeacherLayoutContext)
  if (!ctx) {
    throw new Error("useTeacherLayout must be used within TeacherLayoutProvider")
  }
  return ctx
}
