"use client"

import { useCallback, useEffect, useState } from "react"
import { useDemo } from "@/components/providers/DemoProvider"

export interface ParentAnnouncement {
  id: string
  title: string
  body: string
}

export function useParentAnnouncements(): ParentAnnouncement[] {
  const { databaseEnabled } = useDemo()
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([])

  const load = useCallback(async () => {
    if (!databaseEnabled) {
      setAnnouncements([])
      return
    }
    const res = await fetch("/api/announcements?audience=parents")
    if (res.ok) {
      const data = await res.json()
      setAnnouncements(data.announcements ?? [])
    } else {
      setAnnouncements([])
    }
  }, [databaseEnabled])

  useEffect(() => {
    void load()
  }, [load])

  return announcements
}
