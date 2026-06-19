"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const usesOwnShell =
    pathname.startsWith("/admin") || pathname.startsWith("/teacher")

  if (usesOwnShell) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
