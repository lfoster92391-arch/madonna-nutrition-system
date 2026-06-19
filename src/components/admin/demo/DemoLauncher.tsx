"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, GraduationCap, Play, Shield, Users } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  openParentDemoWalkthrough,
  type DemoPortal,
} from "@/lib/demo/session"
import { cn } from "@/lib/utils"

const PORTAL_ICONS: Record<DemoPortal, typeof Users> = {
  parent: Users,
  admin: Shield,
  teacher: GraduationCap,
}

interface DemoLauncherProps {
  expanded: boolean
  onCloseMobile?: () => void
}

export function DemoLauncher({ expanded, onCloseMobile }: DemoLauncherProps) {
  const router = useRouter()
  const { login } = useAuth()
  const { activateDemoPreview, demoPreviewActive } = useDemo()
  const [open, setOpen] = useState(false)
  const [launching, setLaunching] = useState<DemoPortal | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function launch(portal: DemoPortal) {
    const account = DEMO_ACCOUNTS.find((item) => item.portal === portal)
    if (!account) return

    setLaunching(portal)
    setError(null)
    activateDemoPreview()

    const result = await login(
      account.username,
      DEMO_PASSWORD,
      account.role as Exclude<import("@/components/providers/AuthProvider").PortalRole, null>
    )
    if (!result.success) {
      setError(result.error ?? "Unable to start demo.")
      setLaunching(null)
      return
    }

    onCloseMobile?.()
    router.push(account.path)
    setLaunching(null)
  }

  if (!expanded) {
    return (
      <button
        type="button"
        title="Demo portals"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "mx-auto flex h-11 w-11 items-center justify-center rounded-lg transition",
          demoPreviewActive ? "bg-amber-400/20 text-amber-200" : "bg-white/10 text-white hover:bg-white/15"
        )}
        aria-label="Open demo launcher"
      >
        <Play className="h-4 w-4" />
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition",
          demoPreviewActive
            ? "border-amber-300/30 bg-amber-400/10 text-amber-100"
            : "border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
        )}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Play className="h-3.5 w-3.5 shrink-0" />
          Demo
          {demoPreviewActive ? (
            <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-100">
              Active
            </span>
          ) : null}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="space-y-1 rounded-lg border border-white/10 bg-black/20 p-1.5">
          <button
            type="button"
            onClick={() => {
              openParentDemoWalkthrough()
              onCloseMobile?.()
              setOpen(false)
            }}
            className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-white/10"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-400/20">
              <Users className="h-3.5 w-3.5 text-amber-100" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-white">Parent Demo (Sarah)</span>
              <span className="block truncate text-[11px] text-white/60">
                Opens walkthrough in new tab — demonstration only
              </span>
            </span>
          </button>
          <div className="my-1 border-t border-white/10" />
          {DEMO_ACCOUNTS.filter((account) => account.portal !== "parent").map((account) => {
            const Icon = PORTAL_ICONS[account.portal]
            const busy = launching === account.portal
            return (
              <button
                key={account.portal}
                type="button"
                disabled={busy || launching !== null}
                onClick={() => void launch(account.portal)}
                className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-white/10 disabled:opacity-60"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-white">{account.label}</span>
                  <span className="block truncate text-[11px] text-white/60">{account.subtitle}</span>
                </span>
              </button>
            )
          })}
          {error ? <p className="px-2 py-1 text-[11px] text-red-300">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
