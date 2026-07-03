"use client"

import { StaffLayoutProvider } from "@/components/staff/layout/staff-layout-context"
import { StaffSidebar } from "@/components/staff/layout/StaffSidebar"
import { StaffTopBar } from "@/components/staff/layout/StaffTopBar"
import { STAFF_BG } from "@/components/staff/layout/staff-theme"

export function StaffLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <StaffLayoutProvider>
      <div
        className="staff-portal flex h-[100dvh] flex-col overflow-x-hidden"
        style={{ backgroundColor: STAFF_BG }}
      >
        <div className="flex min-h-0 min-w-0 flex-1">
          <StaffSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <StaffTopBar />
            <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
          </div>
        </div>
      </div>
    </StaffLayoutProvider>
  )
}
