"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"

export type ParentInboxAlert = {
  id: string
  type: string
  title: string
  message: string
  studentId: string | null
  studentName: string | null
  createdAt: string
}

const ALERT_TYPES = new Set([
  "STUDENT_LUNCH_ORDER",
  "MEAL_CHARGE",
  "LOW_BALANCE",
  "NEGATIVE_BALANCE",
])

/** Unread in-app parent notifications (student orders, charges, balance). */
export function useParentInboxAlerts() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [alerts, setAlerts] = useState<ParentInboxAlert[]>([])

  const refresh = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setAlerts([])
      return
    }
    try {
      const res = await fetch("/api/inbox", {
        headers: { "x-session-user-id": user.id },
      })
      if (!res.ok) {
        setAlerts([])
        return
      }
      const data = (await res.json()) as {
        notifications?: Array<{
          id: string
          type: string
          title: string
          message: string
          read: boolean
          studentId: string | null
          studentName: string | null
          createdAt: string
        }>
      }
      const mapped = (data.notifications ?? [])
        .filter((n) => !n.read && ALERT_TYPES.has(n.type))
        .slice(0, 12)
        .map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          studentId: n.studentId,
          studentName: n.studentName,
          createdAt: n.createdAt,
        }))
      setAlerts(mapped)
    } catch {
      setAlerts([])
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { alerts, refresh }
}
