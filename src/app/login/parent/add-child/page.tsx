"use client"

import Link from "next/link"
import { ParentLinkStudentForm } from "@/components/auth/ParentLinkStudentForm"
import { useAuth } from "@/components/providers/AuthProvider"
import { canAccessParentPortal } from "@/lib/auth/portal-roles"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const NAVY = "#001E62"

/** Signed-in parents (including dual-role staff/teachers) add siblings here. */
export default function ParentAddChildPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user || !canAccessParentPortal(user)) {
      router.replace("/login/parent")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || !canAccessParentPortal(user)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#64748B]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <Link
        href="/parent/settings"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        &larr; Back to family settings
      </Link>
      <ParentLinkStudentForm allowSkipToPortal />
    </div>
  )
}
