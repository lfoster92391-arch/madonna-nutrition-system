"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { getPendingSubmission } from "@/data/demo"
import { isDietaryFormBlocking, type AllergySubmission, type StudentProfile } from "@/lib/types"

export function AnnualReviewBanner({
  profiles,
  studentName,
  profileHref,
  allergySubmissions = [],
}: {
  profiles: StudentProfile[]
  studentName?: string
  profileHref?: string
  allergySubmissions?: AllergySubmission[]
}) {
  const dueProfiles = profiles.filter((p) => {
    const pending = getPendingSubmission(p.studentId, allergySubmissions)
    return isDietaryFormBlocking(p, pending)
  })
  if (dueProfiles.length === 0) return null

  const label = studentName
    ? `Update the dietary and food allergy form for ${studentName}`
    : "Update dietary and food allergy forms for your students"

  return (
    <div className="rounded-[20px] border-2 border-warning bg-warning/10 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <AlertTriangle className="h-8 w-8 shrink-0 text-warning" />
          <div>
            <p className="text-lg font-bold text-primary">Dietary &amp; Food Allergy Maintenance Required</p>
            <p className="mt-1 text-base text-silver-foreground">{label}</p>
            <p className="mt-2 text-sm text-silver-foreground">
              Forms must be reviewed annually or when requested by the school. Lunch reservations are
              blocked until forms are complete and current.
            </p>
          </div>
        </div>
        <Link
          href={profileHref ?? "/parent/student-profile"}
          className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-base font-semibold text-white hover:bg-primary/90"
        >
          Update Form
        </Link>
      </div>
    </div>
  )
}
