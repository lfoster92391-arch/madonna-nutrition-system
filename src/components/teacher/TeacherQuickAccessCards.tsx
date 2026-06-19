"use client"

import Link from "next/link"
import { Calendar, ClipboardList, Megaphone, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

const cards = [
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
    label: "Messages",
    description: "Nutrition office messages",
    href: "/teacher/messages",
    icon: MessageSquare,
  },
]

export function TeacherQuickAccessCards() {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        Quick Access
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, description, href, icon: Icon }) => (
          <Link key={label} href={href}>
            <Card
              className="flex h-full flex-col rounded-2xl border p-6 shadow-sm transition hover:bg-[#0A1E3F]/5"
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
