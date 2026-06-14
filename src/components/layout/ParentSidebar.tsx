"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  AlertTriangle,
  CreditCard,
  HelpCircle,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
  { label: "Food Safety Center", href: "/parent/student-profile", icon: ShieldAlert },
  { label: "My Students", href: "/parent/students", icon: Users },
  { label: "Add Funds", href: "/parent/add-funds", icon: Wallet },
  { label: "Meal History", href: "/parent/meal-history", icon: History },
  { label: "Transactions", href: "/parent/transactions", icon: CreditCard },
  { label: "Low Balance Alerts", href: "/parent/alerts", icon: AlertTriangle },
  { label: "Settings", href: "/parent/settings", icon: Settings },
  { label: "Payment Methods", href: "/parent/payment-methods", icon: CreditCard },
  { label: "Help & Support", href: "/parent/help", icon: HelpCircle },
]

export function ParentSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-primary text-white">
      <div className="border-b border-white/10 p-6">
        <Link href="/parent" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Dons" width={48} height={48} className="rounded-lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Madonna Nutrition</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">Management System</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/parent" && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
                active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
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
          className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </nav>

      <div className="border-t border-white/10 p-6">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="" width={32} height={32} className="rounded-md opacity-90" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">{DEMO_SCHOOL.name}</p>
            <p className="text-[10px] uppercase text-white/60">{DEMO_SCHOOL.location}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
