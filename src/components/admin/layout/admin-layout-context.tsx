"use client"

import { createContext, useContext, useState } from "react"

type AdminLayoutContextValue = {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void
  mobileRailOpen: boolean
  setMobileRailOpen: (open: boolean) => void
}

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null)

export function AdminLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileRailOpen, setMobileRailOpen] = useState(false)

  return (
    <AdminLayoutContext.Provider
      value={{ mobileSidebarOpen, setMobileSidebarOpen, mobileRailOpen, setMobileRailOpen }}
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
