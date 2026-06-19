"use client"

import Link from "next/link"
import { Megaphone } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

export function TeacherDashboardAnnouncements() {
  const { announcements } = useTeacherData()

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          <Megaphone className="h-5 w-5" />
          Lunch Announcements
        </h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/teacher/announcements">View All</Link>
        </Button>
      </div>
      <Card
        className="rounded-2xl border p-6 shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div className="space-y-4">
          {announcements.slice(0, 3).map((ann) => (
            <div
              key={ann.id}
              className="border-b pb-4 last:border-0 last:pb-0"
              style={{ borderColor: TEACHER_SILVER }}
            >
              <p className="font-semibold" style={{ color: TEACHER_NAVY }}>
                {ann.title}
              </p>
              <p className="mt-1 text-sm text-silver-foreground">{ann.body}</p>
              <p className="mt-2 text-xs text-silver-foreground">
                {new Date(ann.date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
