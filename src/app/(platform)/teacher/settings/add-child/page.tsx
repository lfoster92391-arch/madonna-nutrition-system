"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { StaffLinkStudentForm } from "@/components/staff/StaffLinkStudentForm"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"

export default function TeacherAddChildPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "teacher") {
      router.replace("/login/teacher")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "teacher") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" style={{ backgroundColor: TEACHER_BG }}>
        <p className="text-lg text-silver-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 sm:p-6" style={{ backgroundColor: TEACHER_BG }}>
      <StaffLinkStudentForm backHref="/teacher/settings" />
    </div>
  )
}
