"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  ScanLine,
  ShieldAlert,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Scan Station", href: "/scan", icon: ScanLine },
  { label: "Admin Portal", href: "/admin", icon: Users },
  { label: "Menu Library", href: "/admin/menu-library", icon: UtensilsCrossed },
  { label: "Allergy Review", href: "/admin/allergy-review", icon: ShieldAlert },
  { label: "Transactions", href: "/transactions", icon: Wallet },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Parent Portal", href: "/parent", icon: ClipboardList },
  { label: "Ops Center", href: "/ops", icon: LayoutDashboard },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver bg-primary text-white">
      <SidebarBrand />

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
                active
                  ? "bg-success text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
