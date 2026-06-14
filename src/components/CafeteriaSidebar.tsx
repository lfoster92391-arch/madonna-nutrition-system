"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SidebarBrand } from "@/components/layout/SidebarBrand"
import { cn } from "@/lib/utils"

const links = [
  {
    label: "Dashboard",
    href: "/cafeteria",
  },
  {
    label: "Scan Station",
    href: "/cafeteria/scan",
  },
  {
    label: "Inventory",
    href: "/cafeteria/inventory",
  },
  {
    label: "Waste",
    href: "/cafeteria/waste",
  },
  {
    label: "Weekly Menu",
    href: "/cafeteria/menu",
  },
  {
    label: "Parent Portal",
    href: "/cafeteria/parent-portal",
  },
  {
    label: "Agreements",
    href: "/cafeteria/agreement",
  },
  {
    label: "Notifications",
    href: "/cafeteria/notifications",
  },
  {
    label: "Temperature Logs",
    href: "/cafeteria/temperature",
  },
]

export default function CafeteriaSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-silver bg-primary text-white">
      <SidebarBrand href="/cafeteria" portalLabel="Cafeteria Portal" />

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`)

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-h-12 items-center rounded-2xl px-4 text-sm font-medium transition",
                active
                  ? "bg-success text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
