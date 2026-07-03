"use client"

import { createContext, useCallback, useContext, useState } from "react"

type StaffLayoutContextValue = {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
}

const StaffLayoutContext = createContext<StaffLayoutContextValue | null>(null)

export function StaffLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpenState] = useState(false)

  const setMobileSidebarOpen = useCallback((open: boolean) => {
    setMobileSidebarOpenState(open)
  }, [])

  return (
    <StaffLayoutContext.Provider value={{ mobileSidebarOpen, setMobileSidebarOpen }}>
      {children}
    </StaffLayoutContext.Provider>
  )
}

export function useStaffLayout() {
  const ctx = useContext(StaffLayoutContext)
  if (!ctx) {
    throw new Error("useStaffLayout must be used within StaffLayoutProvider")
  }
  return ctx
}
