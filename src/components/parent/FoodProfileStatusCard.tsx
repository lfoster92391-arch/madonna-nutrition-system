"use client"

import { DietaryFormStatusCard } from "@/components/parent/DietaryFormStatusCard"
import type { AllergySubmission, StudentProfile } from "@/lib/types"

/** @deprecated Use DietaryFormStatusCard */
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
  return (
    <DietaryFormStatusCard
      studentId={studentId}
      studentName={studentName}
      profile={profile}
      pendingSubmission={pendingSubmission}
    />
  )
}
