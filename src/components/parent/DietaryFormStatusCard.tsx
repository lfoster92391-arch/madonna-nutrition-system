"use client"

import Link from "next/link"
import {
  getFoodProfileDisplayLabel,
  getFoodProfileStatus,
  isDietaryFormBlocking,
  type AllergySubmission,
  type FoodProfileStatus,
  type StudentProfile,
} from "@/lib/types"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<
  FoodProfileStatus,
  { emoji: string; color: string; bg: string }
> = {
  complete: { emoji: "🟢", color: "text-success", bg: "border-success/30 bg-success/5" },
  needs_review: { emoji: "🟡", color: "text-warning", bg: "border-warning/30 bg-warning/5" },
  overdue: { emoji: "🔴", color: "text-danger", bg: "border-danger/30 bg-danger/5" },
  incomplete: { emoji: "🔴", color: "text-danger", bg: "border-danger/30 bg-danger/5" },
}

export function DietaryFormStatusCard({
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
  const blocking = isDietaryFormBlocking(profile, pendingSubmission)

  return (
    <Card className={cn("rounded-[20px] p-5 shadow-sm", config.bg)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-silver-foreground">
            Dietary &amp; Food Allergy — {studentName}
          </p>
          <p className={cn("mt-1 text-xl font-bold", config.color)}>
            {config.emoji} {getFoodProfileDisplayLabel(status)}
          </p>
          {blocking && (
            <p className="mt-2 text-sm text-silver-foreground">
              This form must be complete and current before lunch reservations can proceed.
            </p>
          )}
        </div>
        <Link
          href={`/parent/student-profile/${studentId}?tab=dietary`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {blocking ? "Update Form" : "View Form"}
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
          Renewal Due:{" "}
          <span className="font-medium text-primary">
            {profile?.allergyExpiresAt
              ? new Date(profile.allergyExpiresAt).toLocaleDateString()
              : "—"}
          </span>
        </p>
        {profile?.updateRequestedAt && (
          <p className="font-medium text-warning">
            School requested an update on{" "}
            {new Date(profile.updateRequestedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  )
}
