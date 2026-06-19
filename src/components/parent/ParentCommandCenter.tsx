"use client"

import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { buildAlertItems, countAttentionItems } from "@/components/parent/AlertCenter"
import { ParentHero } from "@/components/parent/ParentHero"
import { QuickActionsStrip } from "@/components/parent/QuickActionsStrip"
import { StudentCardRow } from "@/components/parent/StudentCardRow"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { getPendingSubmission, getStudentProfile } from "@/data/demo"
import { isDietaryFormBlocking } from "@/lib/types"

export function ParentCommandCenter() {
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()

  const firstName = user?.displayName.split(" ")[0] ?? "Parent"
  const totalBalance = parentLinkedStudents.reduce((sum, s) => sum + s.balance, 0)
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

  const alertItems = buildAlertItems({
    lowBalanceStudents,
    dietaryFormIssueCount: dietaryFormIssues.length,
    reviewHref,
    announcements: parentAnnouncements,
  })

  const navAlertCount = countAttentionItems(alertItems)

  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <ParentHero
        parentName={firstName}
        studentsActive={parentLinkedStudents.length}
        accountBalance={totalBalance}
        actionsRequired={navAlertCount}
        reviewHref={reviewHref}
      />
      <StudentCardRow />
      <QuickActionsStrip />
    </div>
  )
}
