"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { isReviewDue } from "@/lib/food-safety"
import type { StudentProfile } from "@/lib/types"

export function AnnualReviewBanner({
  profiles,
  studentName,
  profileHref,
}: {
  profiles: StudentProfile[]
  studentName?: string
  profileHref?: string
}) {
  const dueProfiles = profiles.filter((p) => isReviewDue(p.allergyExpiresAt))
  if (dueProfiles.length === 0) return null

  const label = studentName
    ? `Review and confirm nutrition information for ${studentName}`
    : "Review and confirm student nutrition information"

  return (
    <div className="rounded-[20px] border-2 border-warning bg-warning/10 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <AlertTriangle className="h-8 w-8 shrink-0 text-warning" />
          <div>
            <p className="text-lg font-bold text-primary">Annual Nutrition Review Required</p>
            <p className="mt-1 text-base text-silver-foreground">{label}</p>
            <p className="mt-2 text-sm text-silver-foreground">
              Please verify allergies, update dietary restrictions, and sign the acknowledgment form.
            </p>
          </div>
        </div>
        <Link
          href={profileHref ?? "/parent/student-profile"}
          className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-base font-semibold text-white hover:bg-primary/90"
        >
          Review Now
        </Link>
      </div>
    </div>
  )
}
