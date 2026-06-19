"use client"

import { MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY, TEACHER_SILVER } from "@/components/teacher/layout/teacher-theme"

const DEMO_MESSAGES = [
  {
    id: "msg-1",
    from: "Nutrition Office",
    subject: "Menu change — Thursday",
    preview: "Grilled chicken replaced with pasta bar due to delivery delay.",
    time: "9:15 AM",
    unread: true,
  },
  {
    id: "msg-2",
    from: "Nutrition Office",
    subject: "Lunch badge reminder",
    preview: "Please remind students to bring badges to the cafeteria this week.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "msg-3",
    from: "Nutrition Office",
    subject: "Special meal sign-up",
    preview: "Taco Tuesday sign-ups close at 10:00 AM Monday.",
    time: "May 8",
    unread: false,
  },
]

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

      <div className="space-y-3">
        {DEMO_MESSAGES.map((msg) => (
          <Card
            key={msg.id}
            className="rounded-2xl border p-4 shadow-sm transition hover:bg-[#0A1E3F]/5"
            style={{ borderColor: TEACHER_SILVER }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F7F8FB" }}
              >
                <MessageSquare className="h-4 w-4" style={{ color: TEACHER_NAVY }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold" style={{ color: TEACHER_NAVY }}>
                    {msg.subject}
                  </p>
                  <span className="shrink-0 text-xs" style={{ color: TEACHER_SILVER }}>
                    {msg.time}
                  </span>
                </div>
                <p className="text-xs" style={{ color: TEACHER_SILVER }}>
                  From {msg.from}
                </p>
                <p className="mt-1 text-sm text-silver-foreground">{msg.preview}</p>
                {msg.unread ? (
                  <span
                    className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                    style={{ backgroundColor: TEACHER_NAVY }}
                  >
                    New
                  </span>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
