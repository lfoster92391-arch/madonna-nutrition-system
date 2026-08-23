"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { canAccessParentPortal } from "@/lib/auth/portal-roles"

const LINK_PATH = "/login/parent/link"

/**
 * Parent-only accounts need at least one linked student.
 * Staff/admin/teachers who are also parents can open the parent portal and link children there.
 * Admins may preview the parent experience without a ParentStudent link.
 */
export function ParentAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [linkChecked, setLinkChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!user || !canAccessParentPortal(user)) {
      router.replace("/login/parent")
      return
    }

    const workplaceParent = user.role !== "parent"

    if (user.needsStudentLink && !workplaceParent) {
      router.replace(LINK_PATH)
      return
    }

    let cancelled = false
    setLinkChecked(false)

    async function verifyLink() {
      try {
        const res = await fetch("/api/auth/parent/link-student", {
          headers: { "x-session-user-id": user!.id },
        })
        const data = (await res.json().catch(() => ({}))) as { hasLinkedStudents?: boolean }
        if (cancelled) return
        if (!res.ok || !data.hasLinkedStudents) {
          if (workplaceParent) {
            setAllowed(true)
            return
          }
          setAllowed(false)
          router.replace(LINK_PATH)
          return
        }
        setAllowed(true)
      } catch {
        if (!cancelled) {
          if (workplaceParent) {
            setAllowed(true)
          } else {
            setAllowed(false)
            router.replace(LINK_PATH)
          }
        }
      } finally {
        if (!cancelled) setLinkChecked(true)
      }
    }

    void verifyLink()
    return () => {
      cancelled = true
    }
  }, [user, isLoading, router, pathname, logout])

  if (isLoading || !linkChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-silver-foreground">Loading...</p>
      </div>
    )
  }

  if (!user || !canAccessParentPortal(user) || !allowed) return null

  const adminPreview = user.role === "admin"

  return (
    <>
      {adminPreview ? (
        <div className="border-b border-amber-300/50 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
          Admin parent preview — no student link required.{" "}
          <a href="/admin/parent-preview" className="font-semibold underline">
            Preview controls
          </a>
          {" · "}
          <a href="/admin" className="font-semibold underline">
            Back to admin
          </a>
        </div>
      ) : null}
      {children}
    </>
  )
}
