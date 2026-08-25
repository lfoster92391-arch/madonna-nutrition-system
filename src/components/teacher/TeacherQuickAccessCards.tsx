"use client"

import Link from "next/link"
import { BookOpen, Calendar, ClipboardList, Megaphone, UtensilsCrossed } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

const cards = [
  {
    label: "Sign up a student",
    description: "Search any student and reserve lunch",
    href: "/teacher/sign-up-student",
    icon: UtensilsCrossed,
  },
  {
    label: "Meal Roster",
    description: "View today's lunch roster",
    href: "/teacher/meal-roster",
    icon: ClipboardList,
  },
  {
    label: "Lunch Calendar",
    description: "Published menu schedule",
    href: "/teacher/calendar",
    icon: Calendar,
  },
  {
    label: "Announcements",
    description: "Menu & schedule updates",
    href: "/teacher/announcements",
    icon: Megaphone,
  },
  {
    label: "How-to guide",
    description: "Step-by-step workplace help",
    href: "/teacher/guide",
    icon: BookOpen,
  },
]

export function TeacherQuickAccessCards() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Quick Access
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, description, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <Card
              className="flex h-full flex-col rounded-2xl border p-4 shadow-sm transition hover:bg-[#0A1E3F]/5 sm:p-6"
              style={{ borderColor: TEACHER_SILVER }}
            >
              <Icon className="h-6 w-6" style={{ color: TEACHER_NAVY }} />
              <p className="mt-4 font-semibold" style={{ color: TEACHER_NAVY }}>
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
