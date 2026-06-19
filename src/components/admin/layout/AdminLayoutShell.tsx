"use client"

import { AdminFooter } from "@/components/admin/layout/AdminFooter"
import { AdminQuickActionBar } from "@/components/admin/layout/AdminQuickActionBar"
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar"
import { AdminTopBar } from "@/components/admin/layout/AdminTopBar"
import { AdminUtilityRail } from "@/components/admin/layout/AdminUtilityRail"
import { ADMIN_BG } from "@/components/admin/layout/admin-theme"

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-portal flex h-screen flex-col" style={{ backgroundColor: ADMIN_BG }}>
      <div className="flex min-h-0 flex-1">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto pb-28">{children}</main>
            <AdminUtilityRail />
          </div>
          <AdminFooter />
        </div>
      </div>
      <AdminQuickActionBar />
    </div>
  )
}
