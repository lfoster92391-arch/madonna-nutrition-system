"use client"

import { useEffect, useState } from "react"
import { Bell, CheckSquare, ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { mockNotifications } from "@/data/mockNotifications"
import { cn } from "@/lib/utils"
import {
  ADMIN_BG,
  ADMIN_DANGER,
  ADMIN_NAVY,
  ADMIN_RAIL_STORAGE_KEY,
  ADMIN_SILVER,
  ADMIN_SUCCESS,
  ADMIN_WARNING,
} from "@/components/admin/layout/admin-theme"

const RECENT_ACTIVITY = [
  { id: "1", text: "Menu published for next week", time: "12 min ago" },
  { id: "2", text: "Inventory received — Produce delivery", time: "45 min ago" },
  { id: "3", text: "3 allergy reviews pending approval", time: "1 hr ago" },
]

const ASSIGNED_TASKS = [
  { id: "1", title: "Review vendor invoice #4421", due: "Today", priority: "high" },
  { id: "2", title: "Approve production sheet", due: "Tomorrow", priority: "medium" },
  { id: "3", title: "Export monthly finance report", due: "Fri", priority: "low" },
]

export function AdminUtilityRail() {
  const [expanded, setExpanded] = useState(true)

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

  if (!expanded) {
    return (
      <div
        className="flex w-10 shrink-0 flex-col items-center border-l py-4"
        style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
      >
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5"
          aria-label="Expand utility rail"
        >
          <ChevronLeft className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
        </button>
      </div>
    )
  }

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-l"
      style={{ borderColor: ADMIN_SILVER, backgroundColor: "#FFFFFF" }}
    >
      <div
        className="flex h-12 items-center justify-between border-b px-4"
        style={{ borderColor: ADMIN_SILVER }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: ADMIN_NAVY }}>
          Utility Rail
        </p>
        <button
          type="button"
          onClick={toggle}
          className="flex h-7 w-7 items-center justify-center rounded-xl transition hover:bg-[#0A1E3F]/5"
          aria-label="Collapse utility rail"
        >
          <ChevronRight className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <RailSection icon={Clock} title="Recent Activity">
          <ul className="space-y-3">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="rounded-2xl p-3" style={{ backgroundColor: ADMIN_BG }}>
                <p className="text-sm font-medium" style={{ color: ADMIN_NAVY }}>
                  {item.text}
                </p>
                <p className="mt-1 text-xs" style={{ color: ADMIN_SILVER }}>
                  {item.time}
                </p>
              </li>
            ))}
          </ul>
        </RailSection>

        <RailSection icon={Bell} title="Notifications">
          <ul className="space-y-2">
            {mockNotifications.slice(0, 3).map((n) => (
              <li
                key={n.id}
                className="rounded-2xl border p-3"
                style={{ borderColor: ADMIN_SILVER }}
              >
                <p className="text-sm font-medium" style={{ color: ADMIN_NAVY }}>
                  {n.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: ADMIN_SILVER }}>
                  {n.message}
                </p>
              </li>
            ))}
          </ul>
        </RailSection>

        <RailSection icon={CheckSquare} title="Assigned Tasks">
          <ul className="space-y-2">
            {ASSIGNED_TASKS.map((task) => (
              <li
                key={task.id}
                className="flex items-start justify-between gap-2 rounded-2xl p-3"
                style={{ backgroundColor: ADMIN_BG }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: ADMIN_NAVY }}>
                    {task.title}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: ADMIN_SILVER }}>
                    Due {task.due}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                  )}
                  style={{
                    backgroundColor:
                      task.priority === "high"
                        ? `${ADMIN_DANGER}22`
                        : task.priority === "medium"
                          ? `${ADMIN_WARNING}33`
                          : `${ADMIN_SUCCESS}22`,
                    color: ADMIN_NAVY,
                  }}
                >
                  {task.priority}
                </span>
              </li>
            ))}
          </ul>
        </RailSection>
      </div>
    </aside>
  )
}

function RailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bell
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: ADMIN_NAVY }} />
        <h3 className="text-sm font-semibold" style={{ color: ADMIN_NAVY }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}
