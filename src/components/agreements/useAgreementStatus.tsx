"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import type { StudentAgreementStatusDto } from "@/lib/agreements/types"
import type { AgreementVersionDto } from "@/lib/agreements/types"

export const AGREEMENT_STATUS_CHANGED_EVENT = "agreement-status-changed"

const sessionAcceptedUserIds = new Set<string>()

export function markCafeteriaAgreementAccepted(userId: string) {
  if (userId) sessionAcceptedUserIds.add(userId)
}

function isSessionAccepted(userId: string | undefined) {
  return Boolean(userId && sessionAcceptedUserIds.has(userId))
}

interface AgreementStatusState {
  requiresSignature: boolean
  accepted: boolean
  currentVersion: AgreementVersionDto | null
  students: StudentAgreementStatusDto[]
  loading: boolean
}

export function useAgreementStatus() {
  const { user, isLoading: authLoading } = useAuth()
  const { isLoading: demoLoading } = useDemo()
  const requestIdRef = useRef(0)
  const [state, setState] = useState<AgreementStatusState>({
    requiresSignature: false,
    accepted: false,
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
        accepted: false,
        currentVersion: null,
        students: [],
        loading: true,
      })
      return
    }

    const requestId = ++requestIdRef.current
    const userId = user.id
    const alreadyAccepted = isSessionAccepted(userId)

    try {
      const res = await fetch(`/api/agreements/status?parentUserId=${encodeURIComponent(userId)}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
      if (requestId !== requestIdRef.current) return

      if (!res.ok) {
        setState((prev) => ({
          ...prev,
          requiresSignature: alreadyAccepted ? false : prev.requiresSignature,
          accepted: alreadyAccepted || prev.accepted,
          loading: false,
        }))
        return
      }

      const data = await res.json()
      if (requestId !== requestIdRef.current) return

      const acceptedFromDb = Boolean(data.accepted) || data.requiresSignature === false
      if (acceptedFromDb) markCafeteriaAgreementAccepted(userId)

      const accepted = alreadyAccepted || isSessionAccepted(userId) || acceptedFromDb
      setState({
        requiresSignature: accepted ? false : Boolean(data.requiresSignature),
        accepted,
        currentVersion: data.currentVersion,
        students: data.students ?? [],
        loading: false,
      })
    } catch {
      if (requestId !== requestIdRef.current) return
      setState((prev) => ({
        ...prev,
        requiresSignature: alreadyAccepted ? false : prev.requiresSignature,
        accepted: alreadyAccepted || prev.accepted,
        loading: false,
      }))
    }
  }, [user?.id, demoLoading, authLoading])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ accepted?: boolean; userId?: string }>).detail
      const userId = detail?.userId || user?.id
      if (detail?.accepted && userId) {
        markCafeteriaAgreementAccepted(userId)
        setState((prev) => ({
          ...prev,
          requiresSignature: false,
          accepted: true,
          loading: false,
        }))
      }
      void refresh()
    }
    window.addEventListener(AGREEMENT_STATUS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(AGREEMENT_STATUS_CHANGED_EVENT, handler)
  }, [refresh, user?.id])

  return { ...state, refresh }
}

const AGREEMENT_SIGNING_PATHS = new Set(["/parent/agreements", "/parent/agreement"])

export function ParentAgreementGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { requiresSignature, accepted, loading } = useAgreementStatus()

  const gateLoading = loading || authLoading || !user?.id
  const onSigningRoute = AGREEMENT_SIGNING_PATHS.has(pathname ?? "")
  const blocked = requiresSignature && !accepted && !isSessionAccepted(user?.id)

  useEffect(() => {
    if (gateLoading) return
    if (onSigningRoute) return
    if (blocked) {
      router.replace("/parent/agreements")
    }
  }, [gateLoading, blocked, onSigningRoute, router])

  if (gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-[#AEB6C2]">Checking cafeteria agreement...</p>
      </div>
    )
  }

  if (blocked && !onSigningRoute) {
    return null
  }

  return <>{children}</>
}
