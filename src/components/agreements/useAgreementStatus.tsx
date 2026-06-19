"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  ensureDemoPublishedVersion,
  getDemoParentStatus,
} from "@/lib/agreements/demo-store"
import type { StudentAgreementStatusDto } from "@/lib/agreements/types"
import type { AgreementVersionDto } from "@/lib/agreements/types"

interface AgreementStatusState {
  requiresSignature: boolean
  currentVersion: AgreementVersionDto | null
  students: StudentAgreementStatusDto[]
  loading: boolean
}

export function useAgreementStatus() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const [state, setState] = useState<AgreementStatusState>({
    requiresSignature: false,
    currentVersion: null,
    students: [],
    loading: true,
  })

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState({ requiresSignature: false, currentVersion: null, students: [], loading: false })
      return
    }

    if (!databaseEnabled) {
      ensureDemoPublishedVersion()
      const demo = getDemoParentStatus(user.id)
      setState({
        requiresSignature: demo.requiresSignature,
        currentVersion: demo.currentVersion,
        students: demo.students,
        loading: false,
      })
      return
    }

    try {
      const res = await fetch(`/api/agreements/status?parentUserId=${encodeURIComponent(user.id)}`)
      if (!res.ok) throw new Error("Failed to load agreement status")
      const data = await res.json()
      setState({
        requiresSignature: Boolean(data.requiresSignature),
        currentVersion: data.currentVersion,
        students: data.students ?? [],
        loading: false,
      })
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [user?.id, databaseEnabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { ...state, refresh }
}

export function ParentAgreementGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { requiresSignature, loading } = useAgreementStatus()

  useEffect(() => {
    if (loading) return
    if (pathname === "/parent/agreements") return
    if (requiresSignature) {
      router.replace("/parent/agreements")
    }
  }, [loading, requiresSignature, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#AEB6C2]">Checking cafeteria agreement...</p>
      </div>
    )
  }

  if (requiresSignature && pathname !== "/parent/agreements") {
    return null
  }

  return <>{children}</>
}
