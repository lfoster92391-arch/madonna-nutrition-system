"use client"

import { Suspense } from "react"
import { useDemo } from "@/components/providers/DemoProvider"
import { getPendingSubmission, getStudentProfile, parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { AlertCenter, buildAlertItems } from "@/components/parent/AlertCenter"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { isDietaryFormBlocking } from "@/lib/types"

function ParentAlertsContent() {
  const { studentProfiles, allergySubmissions } = useDemo()
  const lowBalanceStudents = parentLinkedStudents.filter((s) => s.balance < 5)
  const dietaryFormIssues = parentLinkedStudents.filter((student) => {
    const profile = getStudentProfile(student.id, studentProfiles)
    const pending = getPendingSubmission(student.id, allergySubmissions)
    return isDietaryFormBlocking(profile, pending)
  })
  const reviewHref =
    dietaryFormIssues.length === 1
      ? `/parent/student-profile/${dietaryFormIssues[0].id}?tab=dietary`
      : "/parent/student-profile"

  const items = buildAlertItems({
    lowBalanceStudents,
    dietaryFormIssueCount: dietaryFormIssues.length,
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
