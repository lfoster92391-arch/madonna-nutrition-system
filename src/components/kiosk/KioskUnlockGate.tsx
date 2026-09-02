"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { isKioskUnlocked } from "@/components/kiosk/KioskPinGate"

type KioskUnlockGateProps = {
  children: ReactNode
}

/**
 * Blocks /kiosk until the station PIN is entered (School Access path) or the user is
 * logged in as admin (Admin quick action bypass).
 */
export function KioskUnlockGate({ children }: KioskUnlockGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [checked, setChecked] = useState(false)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (isLoading) return

    const adminBypass = user?.role === "admin"
    if (adminBypass || isKioskUnlocked()) {
      setAllowed(true)
      setChecked(true)
      return
    }

    setAllowed(false)
    setChecked(true)
    const returnTo = pathname || "/kiosk"
    router.replace(`/access/school/kiosk?return=${encodeURIComponent(returnTo)}`)
  }, [isLoading, pathname, router, user?.role])

  if (!checked || !allowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-silver-foreground">
        Checking station access…
      </div>
    )
  }

  return <>{children}</>
}
