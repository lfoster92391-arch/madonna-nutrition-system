"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { canAccessPortalAsAdminPreview } from "@/lib/auth/portal-roles"

export function StudentAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const allowed =
    Boolean(user) &&
    (user!.role === "student" || canAccessPortalAsAdminPreview("student", user!))

  useEffect(() => {
    if (isLoading) return
    if (!allowed) {
      router.replace("/login/student")
    }
  }, [allowed, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#64748B]">Loading...</p>
      </div>
    )
  }

  if (!allowed || !user) return null

  return (
    <>
      {user.role === "admin" ? (
        <div className="border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Admin student portal preview — lunch ordering APIs stay student-only.{" "}
          <a href="/admin" className="font-semibold underline">
            Back to admin
          </a>
        </div>
      ) : null}
      {children}
    </>
  )
}
