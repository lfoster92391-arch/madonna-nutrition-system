"use client"

import Link from "next/link"
import { getFoodProfileStatus, type FoodProfileStatus, type StudentProfile, type AllergySubmission } from "@/lib/types"
import { Card } from "@/components/ui/card"

const STATUS_CONFIG: Record<
  FoodProfileStatus,
  { emoji: string; label: string; color: string; bg: string }
> = {
  verified: { emoji: "🟢", label: "Verified", color: "text-success", bg: "border-success/30 bg-success/5" },
  pending_review: {
    emoji: "🟡",
    label: "Pending Review",
    color: "text-warning",
    bg: "border-warning/30 bg-warning/5",
  },
  action_needed: {
    emoji: "🔴",
    label: "Action Needed",
    color: "text-danger",
    bg: "border-danger/30 bg-danger/5",
  },
}

export function FoodProfileStatusCard({
  studentId,
  studentName,
  profile,
  pendingSubmission,
}: {
  studentId: string
  studentName: string
  profile?: StudentProfile
  pendingSubmission?: AllergySubmission
}) {
  const status = getFoodProfileStatus(profile, pendingSubmission)
  const config = STATUS_CONFIG[status]

  return (
    <Card className={`rounded-[20px] p-5 shadow-sm ${config.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-silver-foreground">Food Profile — {studentName}</p>
          <p className={`mt-1 text-xl font-bold ${config.color}`}>
            {config.emoji} {config.label}
          </p>
        </div>
        <Link
          href={`/parent/student-profile/${studentId}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Manage
        </Link>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-silver-foreground">
        <p>
          Last Reviewed:{" "}
          <span className="font-medium text-primary">
            {profile?.allergyReviewedAt
              ? new Date(profile.allergyReviewedAt).toLocaleDateString()
              : "Never"}
          </span>
        </p>
        <p>
          Expires:{" "}
          <span className="font-medium text-primary">
            {profile?.allergyExpiresAt
              ? new Date(profile.allergyExpiresAt).toLocaleDateString()
              : "—"}
          </span>
        </p>
      </div>
    </Card>
  )
}
