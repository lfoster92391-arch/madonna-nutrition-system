"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { ParentLinkStudentForm } from "@/components/auth/ParentLinkStudentForm"
import { canAccessParentPortal } from "@/lib/auth/portal-roles"

const NAVY = "#001E62"

export default function ParentLinkStudentPage() {
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
        href="/login/parent"
        className="mb-8 text-sm font-medium hover:underline"
        style={{ color: NAVY }}
      >
        &larr; Parent sign in
      </Link>
      <ParentLinkStudentForm />
    </div>
  )
}
