"use client"

import { AlertTriangle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { OfflineReason } from "@/lib/offline/sync-manager"

interface OfflineBannerProps {
  isOffline: boolean
  isSyncing: boolean
  syncMessage?: string
  pendingCount: number
  staleBalanceWarning?: boolean
  /** Why we are offline — helps cashiers tell Wi‑Fi vs server problems apart. */
  offlineReason?: OfflineReason
}

export function OfflineBanner({
  isOffline,
  isSyncing,
  syncMessage,
  pendingCount,
  staleBalanceWarning,
  offlineReason = "network",
}: OfflineBannerProps) {
  if (!isOffline && !isSyncing && !syncMessage) return null

  const offlineLabel =
    offlineReason === "server"
      ? "Can't reach lunch server — check Wi‑Fi or try again"
      : "No network — offline mode"

  return (
    <div className="shrink-0 space-y-0">
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-sm font-bold uppercase tracking-wide text-white sm:text-base"
        >
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          <span>{offlineLabel}</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold normal-case">
              {pendingCount} queued
            </span>
          )}
        </div>
      )}

      {staleBalanceWarning && isOffline && (
        <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 sm:text-sm">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Balances may update when online
        </div>
      )}

      {(isSyncing || syncMessage) && !isOffline && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold sm:text-base",
            isSyncing ? "bg-[#041B52] text-white" : "bg-[#00A83E]/10 text-[#00A83E]"
          )}
        >
          {isSyncing ? (
            <>
              <Wifi className="h-4 w-4 animate-pulse" aria-hidden />
              Syncing…
            </>
          ) : (
            syncMessage
          )}
        </div>
      )}
    </div>
  )
}
