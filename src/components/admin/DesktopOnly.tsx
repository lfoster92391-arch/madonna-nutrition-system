"use client"

import { Monitor } from "lucide-react"

export function DesktopOnly({
  children,
  message = "Bulk import is available on desktop. Open this page on a computer to upload CSV files.",
}: {
  children: React.ReactNode
  message?: string
}) {
  return (
    <>
      <div className="md:hidden">
        <div className="rounded-2xl border border-silver/60 bg-silver/10 p-6 text-center">
          <Monitor className="mx-auto h-10 w-10 text-silver-foreground" />
          <p className="mt-3 text-sm font-medium text-primary">Desktop only</p>
          <p className="mt-2 text-sm text-silver-foreground">{message}</p>
        </div>
      </div>
      <div className="hidden md:block">{children}</div>
    </>
  )
}
