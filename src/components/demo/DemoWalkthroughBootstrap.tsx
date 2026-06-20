"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentDemoUser } from "@/data/demo"
import { getDemoAccount, readDemoPreview } from "@/lib/demo/session"

const SARAH_SESSION = {
  id: "usr-006",
  username: "sarah.anderson",
  role: "parent" as const,
  displayName: parentDemoUser.name,
  email: parentDemoUser.email,
}

function DemoWalkthroughBootstrapInner() {
  const searchParams = useSearchParams()
  const { activateDemoPreview } = useDemo()

  useEffect(() => {
    if (searchParams.get("demo") !== "sarah") return
    // Only auto-login when demo was explicitly launched (Admin → Demo). Logout clears this flag.
    if (!readDemoPreview()) return

    getDemoAccount("parent")

    if (typeof window === "undefined") return
    const existing = sessionStorage.getItem("mnms-demo-session")
    const parsed = existing ? (JSON.parse(existing) as { username?: string }) : null
    if (parsed?.username === SARAH_SESSION.username) {
      window.history.replaceState(null, "", "/parent")
      return
    }

    activateDemoPreview()
    sessionStorage.setItem("mnms-demo-session", JSON.stringify(SARAH_SESSION))
    window.location.replace("/parent")
  }, [searchParams, activateDemoPreview])

  return null
}

export function DemoWalkthroughBootstrap() {
  return (
    <Suspense fallback={null}>
      <DemoWalkthroughBootstrapInner />
    </Suspense>
  )
}
