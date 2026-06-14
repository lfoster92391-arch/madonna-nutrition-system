"use client"

import { Megaphone } from "lucide-react"
import { useTeacherData } from "@/components/providers/TeacherDataProvider"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/data/demo/teacher"

export function TeacherAnnouncements() {
  const { announcements } = useTeacherData()

  return (
    <Card className="rounded-[20px] border p-6 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: TEACHER_NAVY }}>
        <Megaphone className="h-5 w-5" />
        Announcements
      </h2>
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="border-b pb-4 last:border-0 last:pb-0" style={{ borderColor: "#AEB6C2" }}>
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
  )
}
