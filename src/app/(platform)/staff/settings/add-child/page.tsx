"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { StaffLinkStudentForm } from "@/components/staff/StaffLinkStudentForm"
import { STAFF_BG } from "@/components/staff/layout/staff-theme"

export default function StaffAddChildPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user || user.role !== "staff") {
      router.replace("/login/staff")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "staff") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" style={{ backgroundColor: STAFF_BG }}>
        <p className="text-lg text-silver-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <StaffLinkStudentForm />
    </div>
  )
}
