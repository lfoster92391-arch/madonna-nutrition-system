"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import type { ParentLunchReservation } from "@/lib/parent-lunch-reservations"

/** Loads lunch reservations for the signed-in parent's linked students only. */
export function useParentLunchReservations(): {
  reservations: ParentLunchReservation[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
} {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [reservations, setReservations] = useState<ParentLunchReservation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setReservations([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lunch-reservations?parentUserId=${user.id}`, {
        headers: { "x-session-user-id": user.id },
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        setError(body.error ?? "Unable to load reservations")
        setReservations([])
        return
      }
      const data = (await res.json()) as { reservations?: ParentLunchReservation[] }
      setReservations(data.reservations ?? [])
    } catch {
      setError("Unable to load reservations")
      setReservations([])
    } finally {
      setLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void reload()
  }, [reload])

  return { reservations, loading, error, reload }
}
