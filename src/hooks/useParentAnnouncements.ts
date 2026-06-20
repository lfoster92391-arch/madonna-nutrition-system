"use client"

import { useCallback, useEffect, useState } from "react"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentAnnouncements } from "@/data/demo"

export interface ParentAnnouncement {
  id: string
  title: string
  body: string
}

export function useParentAnnouncements(): ParentAnnouncement[] {
  const { demoPreviewActive, databaseEnabled } = useDemo()
  const [announcements, setAnnouncements] = useState<ParentAnnouncement[]>([])

  const load = useCallback(async () => {
    if (demoPreviewActive) {
      setAnnouncements(parentAnnouncements)
      return
    }
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
  }, [demoPreviewActive, databaseEnabled])

  useEffect(() => {
    void load()
  }, [load])

  return announcements
}
