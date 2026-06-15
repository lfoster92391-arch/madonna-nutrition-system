"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CreditCard,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { cn } from "@/lib/utils"

const SIDEBAR_STORAGE_KEY = "parent-sidebar-expanded"

const navLinks = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard, exact: true },
  { label: "Students", href: "/parent/students", icon: Users },
  { label: "Payments", href: "/parent/payment-methods", icon: CreditCard },
  { label: "History", href: "/parent/meal-history", icon: History },
  { label: "Family Settings", href: "/parent/settings", icon: Settings },
  { label: "Support", href: "/parent/help", icon: HelpCircle },
]

export function ParentSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setExpanded(stored === "true")
    }
  }, [])

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <>
      {expanded && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          aria-label="Close navigation"
          onClick={toggleExpanded}
        />
      )}

      <aside
        className={cn(
          "relative z-40 flex shrink-0 flex-col border-r border-[#C8CDD7] bg-white transition-[width] duration-200 ease-out",
          expanded ? "w-60" : "w-[72px]"
        )}
      >
        <div className="flex h-[60px] items-center border-b border-[#C8CDD7] px-3 sm:h-[68px]">
          <Link href="/parent" className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
            <Image
              src="/dons-crest.svg"
              alt="Fuel The Dons"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
            />
            {expanded && (
              <span className="truncate text-sm font-bold" style={{ color: PARENT_NAVY }}>
                Fuel The Dons
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleExpanded}
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] transition hover:bg-[#041B52]/5"
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={expanded}
          >
            <Menu className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navLinks.map(({ label, href, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`)

            return (
              <Link
                key={href}
                href={href}
                title={!expanded ? label : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-[10px] text-sm font-medium transition",
                  expanded ? "px-3" : "justify-center px-0",
                  active
                    ? "bg-[#041B52] text-white"
                    : "text-[#64748B] hover:bg-[#041B52]/5 hover:text-[#041B52]"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {expanded && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-[#C8CDD7] p-2">
          <button
            type="button"
            onClick={() => {
              logout()
              window.location.href = "/"
            }}
            title={!expanded ? "Logout" : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-3 rounded-[10px] text-sm font-medium text-[#64748B] transition hover:bg-[#041B52]/5 hover:text-[#041B52]",
              expanded ? "px-3" : "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {expanded && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
