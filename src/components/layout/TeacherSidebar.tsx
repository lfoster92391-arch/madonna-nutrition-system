"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Bell,
  Calendar,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  User,
  UtensilsCrossed,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { TEACHER_NAVY } from "@/data/demo/teacher"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard, exact: true },
  { label: "My Lunch & Students", href: "/teacher", icon: UtensilsCrossed, exact: true },
  { label: "Calendar", href: "/teacher/calendar", icon: Calendar },
  { label: "Transactions", href: "/teacher/transactions", icon: CreditCard },
  { label: "Account", href: "/teacher/account", icon: User },
  { label: "Announcements", href: "/teacher/announcements", icon: Megaphone },
  { label: "Help & Support", href: "/teacher/help", icon: HelpCircle },
]

export function TeacherSidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { profile } = useTeacherData()

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r bg-white"
      style={{ borderColor: "#AEB6C2" }}
    >
      <div className="border-b px-4 py-5" style={{ borderColor: "#AEB6C2" }}>
        <Link href="/teacher" className="flex flex-col items-center">
          <Image
            src="/brand-logo.png"
            alt="Fuel the Dons"
            width={240}
            height={60}
            priority
            className="h-auto w-full max-w-[200px] object-contain"
          />
          <p
            className="mt-2 text-center text-[9px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: TEACHER_NAVY }}
          >
            Madonna High School Nutrition System
          </p>
        </Link>
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold" style={{ color: TEACHER_NAVY }}>
            {profile?.displayName ?? user?.displayName}
          </p>
          <p className="text-xs" style={{ color: "#AEB6C2" }}>
            {profile?.department ?? "Teacher Portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navLinks.map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          const isLunchNav = label === "My Lunch & Students"
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition",
                active || (isLunchNav && pathname === "/teacher")
                  ? "text-white"
                  : "hover:bg-[#041B52]/5"
              )}
              style={
                active || (isLunchNav && pathname === "/teacher")
                  ? { backgroundColor: TEACHER_NAVY }
                  : { color: TEACHER_NAVY }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => {
            logout()
            window.location.href = "/"
          }}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium transition hover:bg-[#041B52]/5"
          style={{ color: TEACHER_NAVY }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </nav>

      <div className="border-t p-5" style={{ borderColor: "#AEB6C2" }}>
        <div className="flex items-center justify-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: TEACHER_NAVY }}
          >
            M
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: TEACHER_NAVY }}>
              Madonna Nutrition System
            </p>
            <p className="text-[10px]" style={{ color: "#AEB6C2" }}>
              © 2025 All rights reserved
            </p>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] uppercase" style={{ color: "#AEB6C2" }}>
          {DEMO_SCHOOL.name}
        </p>
      </div>
    </aside>
  )
}
