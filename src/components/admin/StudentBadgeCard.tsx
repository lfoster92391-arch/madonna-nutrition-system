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

export function StudentBadgeCard({ student, className }: StudentBadgeCardProps) {
  const mdId = student.id
  const barcodeValue = (student.barcode?.trim() || mdId).trim()
  const email = studentEmailForBadge(student)
  const grade = student.grade?.trim() || ""
  const hasPhoto = studentHasRealPhoto(student.photo)

  const barcode = useMemo(() => buildCode128Svg(barcodeValue, { height: 40, moduleWidth: 1.4 }), [barcodeValue])

  return (
    <article
      className={cn(
        "student-badge-card flex h-[2.4in] w-[3.6in] break-inside-avoid flex-col overflow-hidden rounded-lg border-2 border-[#0a1e3f] bg-white text-[#0a1e3f]",
        className
      )}
    >
      <header className="flex items-center justify-between bg-[#0a1e3f] px-3 py-1.5 text-white">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Fuel The Dons</span>
        <span className="text-[10px] font-semibold opacity-90">Student Badge</span>
      </header>

      <div className="grid flex-1 grid-cols-[0.95in_1fr] gap-2 p-2.5">
        <div className="relative overflow-hidden rounded-md border border-[#c7ccd6] bg-[#f7f8fb]">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- print-friendly; may be data URLs
            <img
              src={student.photo}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 px-1 text-center">
              <User className="h-8 w-8 text-[#94a3b8]" aria-hidden />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[#64748b]">
                No photo
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-base font-bold leading-tight">
              {student.firstName || "—"}
            </p>
            <p className="truncate text-base font-bold leading-tight">
              {student.lastName || "—"}
            </p>
            <dl className="mt-1 space-y-0.5 text-[10px] leading-snug">
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Email</dt>
                <dd className="min-w-0 truncate">{email || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">Grade</dt>
                <dd>{grade || "—"}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="shrink-0 font-semibold text-[#64748b]">MD ID</dt>
                <dd className="font-mono font-semibold">{mdId || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#c7ccd6] px-2.5 py-1.5">
        {barcode ? (
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="max-w-full overflow-hidden"
              dangerouslySetInnerHTML={{ __html: barcode.svg }}
            />
            <p className="font-mono text-[9px] tracking-wider text-[#0a1e3f]">
              {barcodeValue}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#64748b]">
              Barcode
            </p>
            <p className="font-mono text-sm font-bold tracking-wide">{barcodeValue || "—"}</p>
            <p className="font-mono text-[9px] text-[#64748b]">MD ID {mdId}</p>
          </div>
        )}
      </footer>
    </article>
  )
}
