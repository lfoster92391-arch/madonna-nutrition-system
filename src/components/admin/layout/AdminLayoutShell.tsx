"use client"

import { usePathname } from "next/navigation"
import { AdminFooter } from "@/components/admin/layout/AdminFooter"
import { AdminLayoutProvider } from "@/components/admin/layout/admin-layout-context"
import { AdminQuickActionBar } from "@/components/admin/layout/AdminQuickActionBar"
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar"
import { AdminTopBar } from "@/components/admin/layout/AdminTopBar"
import { AdminUtilityRail } from "@/components/admin/layout/AdminUtilityRail"
import { ADMIN_BG } from "@/components/admin/layout/admin-theme"
import { cn } from "@/lib/utils"

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDesignStudio = pathname?.startsWith("/admin/calendar/design") ?? false

  return (
    <AdminLayoutProvider>
      <div
        className="admin-portal flex h-screen flex-col overflow-x-hidden"
        style={{ backgroundColor: ADMIN_BG }}
      >
        <div className="flex min-h-0 min-w-0 flex-1">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AdminTopBar />
            <AdminQuickActionBar />
            <div className="flex min-h-0 min-w-0 flex-1">
              <main
                className={cn(
                  "min-w-0 flex-1",
                  isDesignStudio
                    ? "flex min-h-0 flex-col overflow-hidden"
                    : "overflow-y-auto"
                )}
              >
                {children}
              </main>
              {!isDesignStudio ? <AdminUtilityRail /> : null}
            </div>
            {!isDesignStudio ? <AdminFooter /> : null}
          </div>
        </div>
      </div>
    </AdminLayoutProvider>
  )
}
