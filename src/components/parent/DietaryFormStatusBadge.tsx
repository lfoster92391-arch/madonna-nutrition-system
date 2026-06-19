"use client"

import {
  getFoodProfileDisplayLabel,
  getFoodProfileStatus,
  type AllergySubmission,
  type FoodProfileStatus,
  type StudentProfile,
} from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_STYLE: Record<
  FoodProfileStatus,
  { pillClassName: string; dotClassName: string; textClassName: string }
> = {
  complete: {
    pillClassName: "bg-success/10 text-success",
    dotClassName: "bg-success",
    textClassName: "text-success",
  },
  needs_review: {
    pillClassName: "bg-warning/10 text-warning",
    dotClassName: "bg-warning",
    textClassName: "text-warning",
  },
  overdue: {
    pillClassName: "bg-danger/10 text-danger",
    dotClassName: "bg-danger",
    textClassName: "text-danger",
  },
  incomplete: {
    pillClassName: "bg-danger/10 text-danger",
    dotClassName: "bg-danger",
    textClassName: "text-danger",
  },
}

export function DietaryFormStatusBadge({
  profile,
  pendingSubmission,
  variant = "pill",
  className,
}: {
  profile?: StudentProfile
  pendingSubmission?: AllergySubmission
  variant?: "pill" | "dot"
  className?: string
}) {
  const status = getFoodProfileStatus(profile, pendingSubmission)
  const style = STATUS_STYLE[status]
  const label = getFoodProfileDisplayLabel(status)

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold",
          style.textClassName,
          className
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", style.dotClassName)} aria-hidden />
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
        style.pillClassName,
        className
      )}
    >
      {label}
    </span>
  )
}
