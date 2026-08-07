"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"

const LINK_PATH = "/login/parent/link"

/**
 * Parent portal requires at least one linked student.
 * Incomplete accounts are sent to the link page; the portal itself stays closed.
 */
export function ParentAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [linkChecked, setLinkChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (!user || user.role !== "parent") {
      router.replace("/login/parent")
      return
    }

    if (user.needsStudentLink) {
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
          setAllowed(false)
          router.replace(LINK_PATH)
          return
        }
        setAllowed(true)
      } catch {
        if (!cancelled) {
          setAllowed(false)
          router.replace(LINK_PATH)
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

  if (!user || user.role !== "parent" || !allowed) return null

  return <>{children}</>
}
