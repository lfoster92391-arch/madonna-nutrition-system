"use client"

import { useMemo } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { scanIdsEquivalent } from "@/lib/scan/scan-id"
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
    const linkedIds = new Set([
      ...(parentUser?.linkedStudentIds ?? []),
      ...(user.linkedStudentIds ?? []),
    ])
    return allStudents.filter(
      (s) =>
        !s.disabled &&
        (linkedIds.has(s.id) ||
          [...linkedIds].some((linkedId) => scanIdsEquivalent(linkedId, s.id)))
    )
  }, [allStudents, user, users])

  return {
    students: linkedStudents,
    isLoading,
  }
}
