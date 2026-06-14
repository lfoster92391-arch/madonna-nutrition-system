"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
    <aside className="w-72 border-r border-slate-800 bg-slate-950 p-6">

      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white">
          Madonna Nutrition
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Operations Platform
        </p>
      </div>

      <nav className="space-y-2">

        {links.map((link) => {
          const active = pathname === link.href

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              {link.label}
            </Link>
          )
        })}

      </nav>

    </aside>
  )
}