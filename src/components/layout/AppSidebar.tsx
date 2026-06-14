"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  ScanLine,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Scan Station", href: "/scan", icon: ScanLine },
  { label: "Admin Portal", href: "/admin", icon: Users },
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
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver/60 bg-white">
      <div className="border-b border-silver/60 p-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/icon.png" alt="Madonna Dons" width={48} height={48} priority className="shrink-0 rounded-lg" />
          <div>
            <p className="text-sm font-bold italic text-primary">Fuel the Dons</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-silver-foreground">
              Nutrition System
            </p>
          </div>
        </Link>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-silver-foreground">
          Operations Platform
        </p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navLinks.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition",
                active
                  ? "bg-primary text-white"
                  : "text-primary/70 hover:bg-silver/30 hover:text-primary"
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
