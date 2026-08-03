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

export function studentHasRealPhoto(photo?: string | null): boolean {
  if (!photo?.trim()) return false
  return !PLACEHOLDER_PHOTO_HINTS.some((hint) => photo.includes(hint))
}

export function studentEmailForBadge(student: Student): string {
  return student.parentContacts?.[0]?.email?.trim() ?? ""
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

  const barcode = useMemo(
    () => buildCode128Svg(barcodeValue, { height: 28, moduleWidth: 1.15 }),
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
        <header className="flex shrink-0 items-center justify-between bg-[#0a1e3f] px-1.5 py-0.5 text-white">
          <span className="text-[8px] font-bold uppercase tracking-[0.12em]">Fuel The Dons</span>
          <span className="text-[8px] font-semibold opacity-90">Student Badge</span>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[0.72in_1fr] gap-1.5 px-1.5 py-1">
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
                <User className="h-5 w-5 text-[#94a3b8]" aria-hidden />
                <span className="text-[7px] font-semibold uppercase tracking-wide text-[#64748b]">
                  No photo
                </span>
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col justify-center gap-0.5 overflow-hidden">
            <p className="truncate text-[13px] font-bold leading-none">
              {student.firstName || "—"}
            </p>
            <p className="truncate text-[13px] font-bold leading-none">
              {student.lastName || "—"}
            </p>
            <dl className="mt-0.5 space-y-px text-[8px] leading-tight">
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

        <footer className="shrink-0 border-t border-[#c7ccd6] px-1.5 py-0.5">
          {barcode ? (
            <div className="flex flex-col items-center gap-px overflow-hidden">
              <div
                className="max-h-[0.32in] max-w-full overflow-hidden [&_svg]:h-[0.28in] [&_svg]:w-auto"
                dangerouslySetInnerHTML={{ __html: barcode.svg }}
              />
              <p className="font-mono text-[7px] leading-none tracking-wider text-[#0a1e3f]">
                {barcodeValue}
              </p>
            </div>
          ) : (
            <div className="text-center leading-none">
              <p className="font-mono text-[10px] font-bold tracking-wide">{barcodeValue || "—"}</p>
              <p className="font-mono text-[7px] text-[#64748b]">MD ID {mdId}</p>
            </div>
          )}
        </footer>
      </div>

      {/* Bottom margin below the 2.0in content cutoff (card is 2.75in tall) */}
      <div className="student-badge-bottom-margin min-h-0 flex-1" aria-hidden />
    </article>
  )
}
