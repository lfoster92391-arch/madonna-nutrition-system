"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import type { StudentAgreementStatusDto } from "@/lib/agreements/types"
import type { AgreementVersionDto } from "@/lib/agreements/types"

export const AGREEMENT_STATUS_CHANGED_EVENT = "agreement-status-changed"

interface AgreementStatusState {
  requiresSignature: boolean
  currentVersion: AgreementVersionDto | null
  students: StudentAgreementStatusDto[]
  loading: boolean
}

export function useAgreementStatus() {
  const { user, isLoading: authLoading } = useAuth()
  const { isLoading: demoLoading } = useDemo()
  const [state, setState] = useState<AgreementStatusState>({
    requiresSignature: false,
    currentVersion: null,
    students: [],
    loading: true,
  })

  const refresh = useCallback(async () => {
    if (demoLoading || authLoading) {
      setState((prev) => ({ ...prev, loading: true }))
      return
    }

    if (!user?.id) {
      setState({
        requiresSignature: false,
        currentVersion: null,
        students: [],
        loading: true,
      })
      return
    }

    try {
      const res = await fetch(`/api/agreements/status?parentUserId=${encodeURIComponent(user.id)}`, {
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to load agreement status")
      const data = await res.json()
      setState({
        requiresSignature: Boolean(data.requiresSignature),
        currentVersion: data.currentVersion,
        students: data.students ?? [],
        loading: false,
      })
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
      }))
    }
  }, [user?.id, demoLoading, authLoading])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ accepted?: boolean }>).detail
      if (detail?.accepted) {
        setState((prev) => ({ ...prev, requiresSignature: false, loading: false }))
      }
      void refresh()
    }
    window.addEventListener(AGREEMENT_STATUS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(AGREEMENT_STATUS_CHANGED_EVENT, handler)
  }, [refresh])

  return { ...state, refresh }
}

const AGREEMENT_SIGNING_PATHS = new Set(["/parent/agreements", "/parent/agreement"])

export function ParentAgreementGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { requiresSignature, loading } = useAgreementStatus()

  const gateLoading = loading || authLoading || !user?.id
  const onSigningRoute = AGREEMENT_SIGNING_PATHS.has(pathname ?? "")

  useEffect(() => {
    if (gateLoading) return
    if (onSigningRoute) return
    if (requiresSignature) {
      router.replace("/parent/agreements")
    }
  }, [gateLoading, requiresSignature, onSigningRoute, router])

  if (gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#AEB6C2]">Checking cafeteria agreement...</p>
      </div>
    )
  }

  if (requiresSignature && !onSigningRoute) {
    return null
  }

  return <>{children}</>
}
