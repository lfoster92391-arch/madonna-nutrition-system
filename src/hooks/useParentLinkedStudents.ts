"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentLinkedStudents } from "@/data/demo"
import type { Student } from "@/lib/types"

/**
 * Students linked to the signed-in parent.
 * During demo preview, returns the Sarah Anderson family sample data.
 */
export function useParentLinkedStudents(): {
  students: Student[]
  isDemoPreview: boolean
  isLoading: boolean
} {
  const { user } = useAuth()
  const { students: allStudents, users, isLoading, demoPreviewActive } = useDemo()

  const linkedStudents = useMemo(() => {
    if (demoPreviewActive) {
      return parentLinkedStudents
    }
    if (!user) return []
    const demoUser = users.find((u) => u.id === user.id)
    const linkedIds = new Set(demoUser?.linkedStudentIds ?? [])
    return allStudents.filter((s) => linkedIds.has(s.id) && !s.disabled)
  }, [allStudents, demoPreviewActive, user, users])

  return {
    students: linkedStudents,
    isDemoPreview: demoPreviewActive,
    isLoading,
  }
}
