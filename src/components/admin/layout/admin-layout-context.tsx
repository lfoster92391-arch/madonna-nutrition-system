"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { ADMIN_RAIL_STORAGE_KEY } from "@/components/admin/layout/admin-theme"

type AdminLayoutContextValue = {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  mobileRailOpen: boolean
  setMobileRailOpen: (open: boolean) => void
  utilityRailExpanded: boolean
  setUtilityRailExpanded: (open: boolean) => void
  toggleUtilityRail: () => void
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null)

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)
  const [utilityRailExpanded, setUtilityRailExpandedState] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_RAIL_STORAGE_KEY)
    if (stored !== null) setUtilityRailExpandedState(stored === "true")
  }, [])

  const setUtilityRailExpanded = useCallback((open: boolean) => {
    setUtilityRailExpandedState(open)
    localStorage.setItem(ADMIN_RAIL_STORAGE_KEY, String(open))
  }, [])

  const toggleUtilityRail = useCallback(() => {
    setUtilityRailExpandedState((prev) => {
      const next = !prev
      localStorage.setItem(ADMIN_RAIL_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  return (
    <AdminLayoutContext.Provider
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
    </AdminLayoutContext.Provider>
  )
}

export function useAdminLayout() {
  const ctx = useContext(AdminLayoutContext)
  if (!ctx) {
    throw new Error("useAdminLayout must be used within AdminLayoutProvider")
  }
  return ctx
}
