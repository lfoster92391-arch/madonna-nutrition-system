"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import type { Student } from "@/lib/types"

/** Students linked to the signed-in parent from database records. */
export function useParentLinkedStudents(): {
  students: Student[]
  isLoading: boolean
} {
  const { user } = useAuth()
  const { students: allStudents, users, isLoading } = useDemo()

  const linkedStudents = useMemo(() => {
    if (!user) return []
    const parentUser = users.find((u) => u.id === user.id)
    const linkedIds = new Set(parentUser?.linkedStudentIds ?? [])
    return allStudents.filter((s) => linkedIds.has(s.id) && !s.disabled)
  }, [allStudents, user, users])

  return {
    students: linkedStudents,
    isLoading,
  }
}
