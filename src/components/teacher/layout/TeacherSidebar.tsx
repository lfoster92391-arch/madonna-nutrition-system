"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  ChevronLeft,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  Settings,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"
import {
  TEACHER_NAVY,
  TEACHER_SIDEBAR_STORAGE_KEY,
  TEACHER_SILVER,
} from "@/components/teacher/layout/teacher-theme"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard, exact: true },
  { label: "Student Lookup", href: "/teacher/student-lookup", icon: Search },
  { label: "Meal Roster", href: "/teacher/meal-roster", icon: ClipboardList },
  { label: "Lunch Calendar", href: "/teacher/calendar", icon: Calendar },
  { label: "Announcements", href: "/teacher/announcements", icon: Megaphone },
  { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
  { label: "Settings", href: "/teacher/settings", icon: Settings },
  { label: "Help", href: "/teacher/help", icon: HelpCircle },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function TeacherSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(TEACHER_SIDEBAR_STORAGE_KEY)
    if (stored !== null) setExpanded(stored === "true")
  }, [])

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(TEACHER_SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "relative z-20 flex shrink-0 flex-col border-r bg-white transition-[width] duration-200",
        expanded ? "w-60" : "w-[72px]"
      )}
      style={{ borderColor: TEACHER_SILVER }}
    >
      <div
        className="flex h-[68px] items-center border-b px-3"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <Link href="/teacher" className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <Image
            src="/brand-logo.png"
            alt="Fuel The Dons"
            width={expanded ? 160 : 40}
            height={40}
            priority
            className={cn(
              "shrink-0 object-contain",
              expanded ? "h-10 w-auto max-w-[140px]" : "h-9 w-9"
            )}
          />
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition hover:bg-[#0A1E3F]/5"
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronLeft className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
          ) : (
            <Menu className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={label}
              href={href}
              title={!expanded ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition",
                active ? "text-white shadow-sm" : "hover:bg-[#0A1E3F]/5"
              )}
              style={active ? { backgroundColor: TEACHER_NAVY } : { color: TEACHER_NAVY }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
          title={!expanded ? "Logout" : undefined}
          className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium transition hover:bg-[#0A1E3F]/5"
          style={{ color: TEACHER_NAVY }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </nav>

      <div className="border-t p-3" style={{ borderColor: TEACHER_SILVER }}>
        {expanded ? (
          <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: "#F7F8FB" }}>
            <p className="text-xs font-semibold" style={{ color: TEACHER_NAVY }}>
              Madonna Nutrition System
            </p>
            <p className="mt-0.5 text-[10px]" style={{ color: TEACHER_SILVER }}>
              {DEMO_SCHOOL.name}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: TEACHER_SILVER }}>
              © 2025 Fuel The Dons
            </p>
          </div>
        ) : (
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: TEACHER_NAVY }}
          >
            M
          </div>
        )}
      </div>
    </aside>
  )
}
