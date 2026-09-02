"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { KioskPinGate } from "@/components/kiosk/KioskPinGate"

function KioskPinPageInner() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("return") || "/kiosk"
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/kiosk"
  return <KioskPinGate returnTo={safeReturn} />
}

export default function SchoolKioskPinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-silver-foreground">
          Loading…
        </div>
      }
    >
      <KioskPinPageInner />
    </Suspense>
  )
}
