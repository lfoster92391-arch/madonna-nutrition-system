"use client"

import { useMemo } from "react"
import { User } from "lucide-react"
import type { Student } from "@/lib/types"
import { buildCode128Svg } from "@/lib/badges/code128-svg"
import { cn } from "@/lib/utils"

/** Default stock photo used when no real student photo is on file. */
const PLACEHOLDER_PHOTO_HINTS = [
  "images.unsplash.com/photo-1535713875002-d1d0cf377fde",
  "images.unsplash.com/photo-1604908176997-431cef8a0b38",
]

const MADONNA_LOGO_SRC = "/branding/madonna-dons-logo.png"

export function studentHasRealPhoto(photo?: string | null): boolean {
  if (!photo?.trim()) return false
  return !PLACEHOLDER_PHOTO_HINTS.some((hint) => photo.includes(hint))
}

export function studentEmailForBadge(student: Student): string {
  return student.parentContacts?.[0]?.email?.trim() ?? ""
}

function badgeStatusLabel(status?: Student["badgeStatus"]): string {
  const normalized = (status ?? "pending").toLowerCase()
  if (normalized === "active") return "ACTIVE"
  if (normalized === "inactive") return "INACTIVE"
  if (normalized === "pending") return "PENDING"
  return normalized.toUpperCase()
}

function badgeStatusTone(status?: Student["badgeStatus"]): string {
  const normalized = (status ?? "pending").toLowerCase()
  if (normalized === "active") return "bg-emerald-600 text-white"
  if (normalized === "inactive") return "bg-slate-500 text-white"
  return "bg-amber-500 text-white"
}

interface StudentBadgeCardProps {
  student: Student
  className?: string
}

/**
 * Physical landscape badge: 3in × 2.75in.
 * Top 0.5in is reserved for the hole punch; printable content sits in the
 * 1.5in band from 0.5in–2.0in from the top (bottom margin below 2.0in).
 */
export function StudentBadgeCard({ student, className }: StudentBadgeCardProps) {
  const mdId = student.id
  const barcodeValue = (student.barcode?.trim() || mdId).trim()
  const email = studentEmailForBadge(student)
  const grade = student.grade?.trim() || ""
  const hasPhoto = studentHasRealPhoto(student.photo)
  const statusLabel = badgeStatusLabel(student.badgeStatus)
  const statusTone = badgeStatusTone(student.badgeStatus)

  const barcode = useMemo(
    () => buildCode128Svg(barcodeValue, { height: 22, moduleWidth: 1.05 }),
    [barcodeValue]
  )

  return (
    <article
      className={cn(
        // Fits landscape badges with top hole: 3in × 2.75in; content 0.5–2.0in from top.
        "student-badge-card box-border flex h-[2.75in] w-[3in] break-inside-avoid flex-col overflow-hidden rounded-md border-2 border-[#0a1e3f] bg-white text-[#0a1e3f]",
        className
      )}
    >
      {/* Hole-punch safe zone — keep clear of photo/name/barcode */}
      <div className="student-badge-punch-gutter h-[0.5in] shrink-0" aria-hidden />

      <div className="student-badge-content flex h-[1.5in] max-h-[1.5in] min-h-0 shrink-0 flex-col overflow-hidden">
        {/* School brand band (~0.5–0.7in from card top) */}
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
              Fuel The Dons
            </p>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[0.68in_1fr] gap-1 px-1.5 py-0.5">
          <div className="relative h-full min-h-0 overflow-hidden rounded-sm border border-[#c7ccd6] bg-[#f7f8fb]">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element -- print-friendly; may be data URLs
              <img
                src={student.photo}
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
              {student.firstName || "—"}
            </p>
            <p className="truncate text-[12px] font-bold leading-none">
              {student.lastName || "—"}
            </p>
            <dl className="mt-0.5 space-y-px text-[7.5px] leading-tight">
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Email</dt>
                <dd className="min-w-0 truncate">{email || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Grade</dt>
                <dd className="truncate">{grade || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">MD ID</dt>
                <dd className="truncate font-mono font-semibold">{mdId || "—"}</dd>
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
                <p className="font-mono text-[6.5px] leading-none tracking-wider text-[#0a1e3f]">
                  {barcodeValue}
                </p>
              </div>
            ) : (
              <div className="text-center leading-none">
                <p className="font-mono text-[9px] font-bold tracking-wide">
                  {barcodeValue || "—"}
                </p>
                <p className="font-mono text-[6.5px] text-[#64748b]">MD ID {mdId}</p>
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

      {/* Bottom margin below the 2.0in content cutoff (card is 2.75in tall) */}
      <div className="student-badge-bottom-margin min-h-0 flex-1" aria-hidden />
    </article>
  )
}
