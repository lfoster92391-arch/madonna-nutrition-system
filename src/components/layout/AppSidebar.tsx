"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Brain,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  LineChart,
  Package,
  ScanLine,
  ShieldAlert,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { cn } from "@/lib/utils"

const NAV_SECTIONS = [
  {
    title: "Core",
    links: [
      { label: "Scan Station", href: "/scan", icon: ScanLine },
      { label: "Admin Portal", href: "/admin", icon: Users },
      { label: "Menu Library", href: "/admin/menu-library", icon: UtensilsCrossed },
      { label: "Allergy Review", href: "/admin/allergy-review", icon: ShieldAlert },
      { label: "Transactions", href: "/transactions", icon: Wallet },
      { label: "Inventory", href: "/inventory", icon: Package },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Parent Portal", href: "/parent", icon: ClipboardList },
      { label: "Ops Center", href: "/ops", icon: LayoutDashboard },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Intelligence", href: "/admin/intelligence", icon: Brain },
      { label: "Forecasting", href: "/admin/forecasting", icon: LineChart },
      { label: "Finance", href: "/admin/finance", icon: DollarSign },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver bg-primary text-white">
      <SidebarBrand />

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV_SECTIONS.map(({ title, links }) => (
          <div key={title}>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              {title}
            </p>
            <div className="space-y-1">
              {links.map(({ label, href, icon: Icon }) => {
                const active = isActive(pathname, href)
                return (
                  <Link
                    key={href + label}
                    href={href}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
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
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
