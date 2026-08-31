"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { isInboxAlertForLinkedChild } from "@/lib/parent/inbox-scope"

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
  const { databaseEnabled, users } = useDemo()
  const [alerts, setAlerts] = useState<ParentInboxAlert[]>([])

  const linkedExternalIds = useMemo(() => {
    if (!user) return new Set<string>()
    const parentUser = users.find((u) => u.id === user.id)
    return new Set([
      ...(parentUser?.linkedStudentIds ?? []),
      ...(user.linkedStudentIds ?? []),
    ])
  }, [user, users])

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
        .filter((n) =>
          isInboxAlertForLinkedChild({
            studentExternalId: n.studentId,
            linkedStudentExternalIds: linkedExternalIds,
          })
        )
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
  }, [user, databaseEnabled, linkedExternalIds])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || !databaseEnabled) return
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [user, databaseEnabled, refresh])

  return { alerts, refresh }
}
