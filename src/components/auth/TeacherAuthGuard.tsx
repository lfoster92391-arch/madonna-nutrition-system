"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { canAccessPortalAsAdminPreview } from "@/lib/auth/portal-roles"

function AdminPreviewBanner({ portal }: { portal: string }) {
  return (
    <div className="border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
      Admin {portal} preview — your account stays Admin.{" "}
      <a href="/admin" className="font-semibold underline">
        Back to admin
      </a>
    </div>
  )
}

export function TeacherAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const allowed =
    Boolean(user) &&
    (user!.role === "teacher" || canAccessPortalAsAdminPreview("teacher", user!))

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/login/teacher")
    }
  }, [allowed, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-silver-foreground">Loading...</p>
      </div>
    )
  }

  if (!allowed || !user) return null

  return (
    <>
      {user.role === "admin" ? <AdminPreviewBanner portal="teacher portal" /> : null}
      {children}
    </>
  )
}
