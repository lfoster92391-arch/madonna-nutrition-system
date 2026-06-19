"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  PackageCheck,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { mockNotifications } from "@/data/mockNotifications"
import { cn } from "@/lib/utils"
import { useAdminLayout } from "@/components/admin/layout/admin-layout-context"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ADMIN_BG,
  ADMIN_DANGER,
  ADMIN_INFO,
  ADMIN_NAVY,
  ADMIN_RAIL_STORAGE_KEY,
  ADMIN_SILVER,
  ADMIN_WARNING,
} from "@/components/admin/layout/admin-theme"

const RECENT_ACTIVITY = [
  { id: "1", text: "Menu published for next week", time: "12 min ago", icon: UtensilsCrossed },
  { id: "2", text: "Inventory received — Produce delivery", time: "45 min ago", icon: PackageCheck },
  { id: "3", text: "3 allergy reviews pending approval", time: "1 hr ago", icon: AlertTriangle },
  { id: "4", text: "Calendar draft saved for June", time: "2 hr ago", icon: Calendar },
]

const ASSIGNED_TASKS = [
  { id: "1", title: "Review vendor invoice #4421", due: "Today", priority: "high" as const },
  { id: "2", title: "Approve production sheet", due: "Tomorrow", priority: "medium" as const },
  { id: "3", title: "Export monthly finance report", due: "Fri", priority: "low" as const },
  { id: "4", title: "Verify parent import batch", due: "Mon", priority: "medium" as const },
]

const PRIORITY_STYLES = {
  high: { bg: `${ADMIN_DANGER}22`, text: ADMIN_DANGER, label: "High" },
  medium: { bg: `${ADMIN_WARNING}33`, text: "#B7791F", label: "Medium" },
  low: { bg: `${ADMIN_INFO}22`, text: ADMIN_INFO, label: "Low" },
}

export function AdminUtilityRail() {
  const [expanded, setExpanded] = useState(true)
  const { mobileRailOpen, setMobileRailOpen } = useAdminLayout()

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_RAIL_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(ADMIN_RAIL_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <>
      <div className="hidden shrink-0 lg:flex">
        {!expanded ? (
          <div
            className="flex w-10 flex-col items-center border-l py-4"
            style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
          >
            <button
              type="button"
              onClick={toggle}
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
            <AdminUtilityRailHeader onCollapse={toggle} />
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

function AdminUtilityRailBody() {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-4">
      <RailSection icon={Clock} title="Recent Activity" viewAllHref="/admin/audit-log">
        <ul className="space-y-2">
          {RECENT_ACTIVITY.map((item) => (
            <li key={item.id} className="flex gap-3 rounded-xl p-3" style={{ backgroundColor: ADMIN_BG }}>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: `${ADMIN_NAVY}10` }}
              >
                <item.icon className="h-3.5 w-3.5" style={{ color: ADMIN_NAVY }} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug" style={{ color: ADMIN_NAVY }}>
                  {item.text}
                </p>
                <p className="mt-1 text-xs" style={{ color: ADMIN_SILVER }}>
                  {item.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </RailSection>

      <RailSection icon={Bell} title="Notifications" viewAllHref="/admin/communication">
        <ul className="space-y-2">
          {mockNotifications.slice(0, 4).map((n) => (
            <li
              key={n.id}
              className="flex gap-3 rounded-xl border p-3"
              style={{ borderColor: ADMIN_SILVER }}
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: n.type === "critical" || n.type === "warning" ? ADMIN_DANGER : ADMIN_SILVER }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: ADMIN_NAVY }}>
                  {n.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: ADMIN_SILVER }}>
                  {n.message}
                </p>
                <p className="mt-1 text-[10px]" style={{ color: ADMIN_SILVER }}>
                  {n.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </RailSection>

      <RailSection icon={CheckSquare} title="Assigned Tasks" viewAllHref="/admin/launch">
        <ul className="space-y-2">
          {ASSIGNED_TASKS.map((task) => {
            const priority = PRIORITY_STYLES[task.priority]
            return (
              <li
                key={task.id}
                className="flex items-start justify-between gap-2 rounded-xl p-3"
                style={{ backgroundColor: ADMIN_BG }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: ADMIN_NAVY }}>
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: ADMIN_SILVER }}>
                    Due {task.due}
                  </p>
                </div>
                <span
                  className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase")}
                  style={{ backgroundColor: priority.bg, color: priority.text }}
                >
                  {priority.label}
                </span>
              </li>
            )
          })}
        </ul>
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
