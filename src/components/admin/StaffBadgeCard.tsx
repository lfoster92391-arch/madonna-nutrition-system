"use client"

import { useMemo } from "react"
import { User } from "lucide-react"
import type { User as StaffUser } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/users"
import { BadgeSchoolHeader } from "@/components/admin/BadgeSchoolHeader"
import { buildCode128Svg } from "@/lib/badges/code128-svg"
import { cn } from "@/lib/utils"

/** Default stock photo used when no real staff photo is on file. */
const PLACEHOLDER_PHOTO_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

export function staffHasRealPhoto(photo?: string | null): boolean {
  if (!photo?.trim()) return false
  return !PLACEHOLDER_PHOTO_HINTS.some((hint) => photo.includes(hint))
}

function badgeStatusLabel(status?: StaffUser["status"]): string {
  const normalized = (status ?? "active").toLowerCase()
  if (normalized === "active") return "ACTIVE"
  if (normalized === "disabled") return "INACTIVE"
  return normalized.toUpperCase()
}

function badgeStatusTone(status?: StaffUser["status"]): string {
  const normalized = (status ?? "active").toLowerCase()
  if (normalized === "active") return "bg-emerald-600 text-white"
  return "bg-slate-500 text-white"
}

interface StaffBadgeCardProps {
  user: StaffUser
  className?: string
}

/** Code128 + badge ID print size: PR #57 floor (33 / 1.575 / 12.4px / 10.7px). */
const BADGE_BARCODE_SVG = { height: 33, moduleWidth: 1.575 } as const

/**
 * Physical landscape badge: 3in × 2.75in (same layout as student badges).
 * Top 0.5in is punch-safe (navy, no logo). Identity and barcode fill the rest.
 */
export function StaffBadgeCard({ user, className }: StaffBadgeCardProps) {
  const badgeId = (user.badgeId?.trim() || "").trim()
  const barcodeValue = badgeId
  const email = user.email?.trim() || ""
  const roleLabel = ROLE_LABELS[user.role] ?? user.role
  const department = user.department?.trim() || ""
  const hasPhoto = staffHasRealPhoto(user.photo)
  const statusLabel = badgeStatusLabel(user.status)
  const statusTone = badgeStatusTone(user.status)

  const barcode = useMemo(
    () => (barcodeValue ? buildCode128Svg(barcodeValue, BADGE_BARCODE_SVG) : null),
    [barcodeValue]
  )

  return (
    <article
      className={cn(
        "student-badge-card box-border flex h-[2.75in] w-[3in] break-inside-avoid flex-col overflow-hidden rounded-md border-2 border-[#0a1e3f] bg-white text-[#0a1e3f]",
        className
      )}
    >
      <BadgeSchoolHeader subtitle="Fuel The Dons · Staff" />

      <div className="student-badge-content flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-cols-[1.02in_1fr] gap-1.5 px-1.5 py-1">
          <div className="relative h-full min-h-0 overflow-hidden rounded-sm border border-[#c7ccd6] bg-[#f7f8fb]">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- print-friendly; may be data URLs
              <img
                src={user.photo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center">
                <User className="h-8 w-8 text-[#94a3b8]" aria-hidden />
                <span className="text-[8px] font-semibold uppercase tracking-wide text-[#64748b]">
                  No photo
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col justify-center gap-0.5 overflow-hidden">
            <p className="truncate text-[16px] font-bold leading-none">
              {user.firstName || "—"}
            </p>
            <p className="truncate text-[16px] font-bold leading-none">
              {user.lastName || "—"}
            </p>
            <span
              className={cn(
                "mt-0.5 w-fit rounded-[3px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                statusTone
              )}
            >
              {statusLabel}
            </span>
            <dl className="mt-0.5 space-y-0.5 text-[9px] leading-tight">
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Role</dt>
                <dd className="truncate font-semibold">{roleLabel}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Dept</dt>
                <dd className="truncate">{department || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Email</dt>
                <dd className="min-w-0 truncate">{email || "—"}</dd>
              </div>
              <div className="flex gap-1 text-[12.4px]">
                <dt className="shrink-0 font-semibold text-[#64748b]">Badge</dt>
                <dd className="truncate font-mono font-semibold">{badgeId || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-center border-t border-[#c7ccd6] px-1.5 py-1">
          <div className="min-w-0 flex-1">
            {barcode ? (
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="flex max-h-[0.39in] max-w-full justify-center [&_svg]:h-[0.33in] [&_svg]:w-auto [&_svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: barcode.svg }}
                />
                <p className="font-mono text-[10.7px] leading-none tracking-wider text-[#0a1e3f]">
                  {barcodeValue}
                </p>
              </div>
            ) : (
              <div className="text-center leading-none">
                <p className="font-mono text-[13.5px] font-bold tracking-wide">No badge ID</p>
                <p className="font-mono text-[10.7px] text-[#64748b]">Set in staff profile</p>
              </div>
            )}
          </div>
        </footer>
      </div>
    </article>
  )
}
