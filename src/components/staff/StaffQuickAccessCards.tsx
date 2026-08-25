"use client"

import Link from "next/link"
import { BookOpen, Calendar, CreditCard, Megaphone, UtensilsCrossed } from "lucide-react"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"

const cards = [
  {
    label: "Sign up a student",
    description: "Search any student and reserve lunch",
    href: "/staff/sign-up-student",
    icon: UtensilsCrossed,
  },
  {
    label: "Lunch Calendar",
    description: "Published menu schedule",
    href: "/staff/calendar",
    icon: Calendar,
  },
  {
    label: "Announcements",
    description: "Menu & schedule updates",
    href: "/staff/announcements",
    icon: Megaphone,
  },
  {
    label: "My Account",
    description: "View cafeteria account balance",
    href: "/staff/account",
    icon: CreditCard,
  },
  {
    label: "How-to guide",
    description: "Step-by-step workplace help",
    href: "/staff/guide",
    icon: BookOpen,
  },
]

export function StaffQuickAccessCards() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: STAFF_NAVY }}>
        Quick Access
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, description, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <Card
              className="flex h-full flex-col rounded-2xl border p-4 shadow-sm transition hover:bg-[#0A1E3F]/5 sm:p-6"
              style={{ borderColor: STAFF_SILVER }}
            >
              <Icon className="h-6 w-6" style={{ color: STAFF_NAVY }} />
              <p className="mt-4 font-semibold" style={{ color: STAFF_NAVY }}>
                {label}
              </p>
              <p className="mt-1 text-sm text-silver-foreground">{description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
