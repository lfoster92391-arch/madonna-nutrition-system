"use client"

import { useCallback } from "react"
import {
  Bell,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAdminLayout } from "@/components/admin/layout/admin-layout-context"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ADMIN_NAVY,
  ADMIN_SILVER,
} from "@/components/admin/layout/admin-theme"

export function AdminUtilityRail() {
  const { mobileRailOpen, setMobileRailOpen, utilityRailExpanded, toggleUtilityRail } =
    useAdminLayout()

  const collapse = useCallback(() => toggleUtilityRail(), [toggleUtilityRail])

  return (
    <>
      <div className="hidden shrink-0 lg:flex">
        {!utilityRailExpanded ? (
          <div
            className="flex w-10 flex-col items-center border-l py-4"
            style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
          >
            <button
              type="button"
              onClick={toggleUtilityRail}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl transition hover:bg-[#0A1E3F]/5"
              aria-label="Expand utility rail"
            >
              <ChevronLeft className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
            </button>
          </div>
        ) : (
          <aside
            className="flex w-80 flex-col border-l"
            style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
          >
            <AdminUtilityRailHeader onCollapse={collapse} />
            <AdminUtilityRailBody />
          </aside>
        )}
      </div>

      <Sheet open={mobileRailOpen} onOpenChange={setMobileRailOpen}>
        <SheetContent side="right" className="flex h-full w-80 max-w-[min(20rem,90vw)] flex-col gap-0 overflow-hidden p-0">
          <SheetHeader className="sr-only">
            <SheetTitle style={{ color: ADMIN_NAVY }}>Activity & Alerts</SheetTitle>
            <SheetDescription>Recent activity, notifications, and assigned tasks</SheetDescription>
          </SheetHeader>
          <AdminUtilityRailHeader />
          <AdminUtilityRailBody />
        </SheetContent>
      </Sheet>
    </>
  )
}

function AdminUtilityRailHeader({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div
      className="flex h-12 shrink-0 items-center justify-between border-b px-4 pr-12 lg:pr-4"
      style={{ borderColor: ADMIN_SILVER }}
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: ADMIN_NAVY }}>
        Activity & Alerts
      </p>
      {onCollapse ? (
        <button
          type="button"
          onClick={onCollapse}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl transition hover:bg-[#0A1E3F]/5"
          aria-label="Collapse utility rail"
        >
          <ChevronRight className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
        </button>
      ) : null}
    </div>
  )
}

function EmptyRailMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-3 text-sm" style={{ borderColor: ADMIN_SILVER, color: ADMIN_SILVER }}>
      {children}
    </p>
  )
}

function AdminUtilityRailBody() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <RailSection icon={Clock} title="Recent Activity" viewAllHref="/admin/audit-log">
        <EmptyRailMessage>No recent activity yet.</EmptyRailMessage>
      </RailSection>

      <RailSection icon={Bell} title="Notifications" viewAllHref="/admin/communication">
        <EmptyRailMessage>No notifications yet.</EmptyRailMessage>
      </RailSection>

      <RailSection icon={CheckSquare} title="Assigned Tasks" viewAllHref="/admin">
        <EmptyRailMessage>No assigned tasks yet.</EmptyRailMessage>
      </RailSection>
    </div>
  )
}

function RailSection({
  icon: Icon,
  title,
  viewAllHref,
  children,
}: {
  icon: LucideIcon
  title: string
  viewAllHref: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
          <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: ADMIN_NAVY }}>
            {title}
          </h3>
        </div>
        <a
          href={viewAllHref}
          className="text-xs font-semibold transition hover:underline"
          style={{ color: ADMIN_NAVY }}
        >
          View All
        </a>
      </div>
      {children}
    </section>
  )
}
