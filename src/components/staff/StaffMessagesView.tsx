"use client"

import { MessageSquare } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { Card } from "@/components/ui/card"
import { STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import type { StaffMessage } from "@/lib/staff/types"

function formatMessageDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function StaffMessagesView() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [messages, setMessages] = useState<StaffMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadMessages = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setMessages([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/staff/messages?staffId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages ?? [])
      } else {
        setMessages([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Messages
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Lunch communication from the nutrition office
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-silver-foreground">Loading messages…</p>
      ) : messages.length === 0 ? (
        <Card
          className="rounded-2xl border p-8 text-center shadow-sm"
          style={{ borderColor: STAFF_SILVER }}
        >
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#F7F8FB" }}
          >
            <MessageSquare className="h-5 w-5" style={{ color: STAFF_NAVY }} />
          </div>
          <p className="mt-4 font-semibold" style={{ color: STAFF_NAVY }}>
            No messages yet
          </p>
          <p className="mt-2 text-sm text-silver-foreground">
            Announcements from the nutrition office will appear here when published.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card
              key={msg.id}
              className="rounded-2xl border p-4 shadow-sm sm:p-6"
              style={{ borderColor: STAFF_SILVER }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold" style={{ color: STAFF_NAVY }}>
                      {msg.title}
                    </p>
                    {!msg.read ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: "#E8EDF5", color: STAFF_NAVY }}
                      >
                        New
                      </span>
                    ) : null}
                    {msg.source === "announcement" ? (
                      <span className="text-xs text-silver-foreground">Broadcast</span>
                    ) : null}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-silver-foreground">
                    {msg.body}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-silver-foreground">
                {formatMessageDate(msg.createdAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
