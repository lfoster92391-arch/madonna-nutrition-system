"use client"

import { AdminFooter } from "@/components/admin/layout/AdminFooter"
import { AdminLayoutProvider } from "@/components/admin/layout/admin-layout-context"
import { AdminQuickActionBar } from "@/components/admin/layout/AdminQuickActionBar"
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar"
import { AdminTopBar } from "@/components/admin/layout/AdminTopBar"
import { AdminUtilityRail } from "@/components/admin/layout/AdminUtilityRail"
import { ADMIN_BG } from "@/components/admin/layout/admin-theme"

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminLayoutProvider>
      <div
        className="admin-portal flex h-[100dvh] flex-col overflow-x-hidden"
        style={{ backgroundColor: ADMIN_BG }}
      >
        <div className="flex min-h-0 min-w-0 flex-1">
          <div className="admin-print-hide contents">
            <AdminSidebar />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
            <div className="admin-print-hide contents">
              <AdminTopBar />
              <AdminQuickActionBar />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1">
              <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
                {children}
              </main>
              <div className="admin-print-hide contents">
                <AdminUtilityRail />
              </div>
            </div>
            <div className="admin-print-hide contents">
              <AdminFooter />
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutProvider>
  )
}
