"use client"

import { useMemo } from "react"
import { User } from "lucide-react"
import type { User as StaffUser } from "@/lib/types"
import { ROLE_LABELS } from "@/lib/users"
import { buildCode128Svg } from "@/lib/badges/code128-svg"
import { cn } from "@/lib/utils"

/** Default stock photo used when no real staff photo is on file. */
const PLACEHOLDER_PHOTO_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

const MADONNA_LOGO_SRC = "/branding/madonna-dons-logo.png"

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

/**
 * Physical landscape badge: 3in × 2.75in (same layout spirit as student badges).
 * Top 0.5in is reserved for the hole punch; printable content sits in the
 * 1.5in band from 0.5in–2.0in from the top.
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
    () => (barcodeValue ? buildCode128Svg(barcodeValue, { height: 22, moduleWidth: 1.05 }) : null),
    [barcodeValue]
  )

  return (
    <article
      className={cn(
        "student-badge-card box-border flex h-[2.75in] w-[3in] break-inside-avoid flex-col overflow-hidden rounded-md border-2 border-[#0a1e3f] bg-white text-[#0a1e3f]",
        className
      )}
    >
      <div className="student-badge-punch-gutter h-[0.5in] shrink-0" aria-hidden />

      <div className="student-badge-content flex h-[1.5in] max-h-[1.5in] min-h-0 shrink-0 flex-col overflow-hidden">
        <header className="flex h-[0.22in] shrink-0 items-center gap-1 bg-[#0a1e3f] px-1.5 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element -- print-friendly static brand asset */}
          <img
            src={MADONNA_LOGO_SRC}
            alt=""
            className="h-[0.18in] w-[0.18in] shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1 leading-none">
            <p className="truncate text-[8px] font-bold uppercase tracking-[0.08em]">
              Madonna High School
            </p>
            <p className="truncate text-[6px] font-semibold uppercase tracking-wide opacity-90">
              Fuel The Dons · Staff
            </p>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[0.68in_1fr] gap-1 px-1.5 py-0.5">
          <div className="relative h-full min-h-0 overflow-hidden rounded-sm border border-[#c7ccd6] bg-[#f7f8fb]">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- print-friendly; may be data URLs
              <img
                src={user.photo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-0.5 px-0.5 text-center">
                <User className="h-4 w-4 text-[#94a3b8]" aria-hidden />
                <span className="text-[6px] font-semibold uppercase tracking-wide text-[#64748b]">
                  No photo
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col justify-center gap-px overflow-hidden">
            <p className="truncate text-[12px] font-bold leading-none">
              {user.firstName || "—"}
            </p>
            <p className="truncate text-[12px] font-bold leading-none">
              {user.lastName || "—"}
            </p>
            <dl className="mt-0.5 space-y-px text-[7.5px] leading-tight">
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Email</dt>
                <dd className="min-w-0 truncate">{email || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Role</dt>
                <dd className="truncate">{roleLabel}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Dept</dt>
                <dd className="truncate">{department || "—"}</dd>
              </div>
              <div className="flex gap-1 text-[8.25px]">
                <dt className="shrink-0 font-semibold text-[#64748b]">Badge</dt>
                <dd className="truncate font-mono font-semibold">{badgeId || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-1.5 border-t border-[#c7ccd6] px-1.5 py-0.5">
          <div className="min-w-0 flex-1 overflow-hidden">
            {barcode ? (
              <div className="flex flex-col items-center gap-px overflow-hidden">
                <div
                  className="max-h-[0.26in] max-w-full overflow-hidden [&_svg]:h-[0.22in] [&_svg]:w-auto"
                  dangerouslySetInnerHTML={{ __html: barcode.svg }}
                />
                <p className="font-mono text-[7.15px] leading-none tracking-wider text-[#0a1e3f]">
                  {barcodeValue}
                </p>
              </div>
            ) : (
              <div className="text-center leading-none">
                <p className="font-mono text-[9px] font-bold tracking-wide">No badge ID</p>
                <p className="font-mono text-[7.15px] text-[#64748b]">Set in staff profile</p>
              </div>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-[2px] px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide",
              statusTone
            )}
          >
            {statusLabel}
          </span>
        </footer>
      </div>

      <div className="student-badge-bottom-margin min-h-0 flex-1" aria-hidden />
    </article>
  )
}
