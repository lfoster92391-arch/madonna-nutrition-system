"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"

export default function StudentProfileIndexPage() {
  const router = useRouter()
  const { students: linkedStudents, isLoading } = useParentLinkedStudents()

  useEffect(() => {
    if (isLoading) return
    const first = linkedStudents[0]
    if (first) {
      router.replace(`/parent/student-profile/${first.id}`)
      return
    }
    router.replace("/parent")
  }, [isLoading, linkedStudents, router])

  return null
}
