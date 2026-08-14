"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import type { KitchenBoardPayload } from "@/lib/kitchen/board-data"

const REFRESH_MS = 20_000

export function useKitchenBoard(date?: string) {
  const { user } = useAuth()
  const [data, setData] = useState<KitchenBoardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const qs = date ? `?date=${encodeURIComponent(date)}` : ""
      const res = await fetch(`/api/admin/kitchen${qs}`, {
        headers: {
          "x-session-user-id": user.id,
          "x-admin-user-id": user.id,
        },
        cache: "no-store",
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? "Unable to load kitchen board")
      }
      const payload = (await res.json()) as KitchenBoardPayload
      setData(payload)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load kitchen board")
    } finally {
      setLoading(false)
    }
  }, [user?.id, date])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), REFRESH_MS)
    return () => clearInterval(timer)
  }, [load])

  return { data, error, loading, refresh: load }
}
