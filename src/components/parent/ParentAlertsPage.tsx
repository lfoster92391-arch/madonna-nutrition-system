"use client"

import { Suspense } from "react"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { AlertCenter, buildAlertItems } from "@/components/parent/AlertCenter"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { isReviewDue } from "@/lib/food-safety"

function ParentAlertsContent() {
  const { studentProfiles } = useDemo()
  const lowBalanceStudents = parentLinkedStudents.filter((s) => s.balance < 5)
  const linkedProfiles = studentProfiles.filter((p) =>
    parentLinkedStudents.some((s) => s.id === p.studentId)
  )
  const reviewDueProfiles = linkedProfiles.filter((p) => isReviewDue(p.allergyExpiresAt))
  const reviewHref =
    reviewDueProfiles.length === 1
      ? `/parent/student-profile/${reviewDueProfiles[0].studentId}`
      : "/parent/student-profile"

  const items = buildAlertItems({
    lowBalanceStudents,
    reviewDueCount: reviewDueProfiles.length,
    reviewHref,
    announcements: parentAnnouncements,
  })

  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl text-[#041B52]">Alerts</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Items that need your attention across your family account.
        </p>
      </header>
      <AlertCenter items={items} />
    </div>
  )
}

export function ParentAlertsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <ParentAlertsContent />
    </Suspense>
  )
}
