"use client"

import { MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

export function TeacherMessagesView() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: TEACHER_NAVY }}>
          Messages
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Lunch communication from the nutrition office
        </p>
      </div>

      <Card
        className="rounded-2xl border p-8 text-center shadow-sm"
        style={{ borderColor: TEACHER_SILVER }}
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F7F8FB" }}
        >
          <MessageSquare className="h-5 w-5" style={{ color: TEACHER_NAVY }} />
        </div>
        <p className="mt-4 font-semibold" style={{ color: TEACHER_NAVY }}>
          No messages yet
        </p>
        <p className="mt-2 text-sm text-silver-foreground">
          Announcements from the nutrition office will appear here when published.
        </p>
      </Card>
    </div>
  )
}
