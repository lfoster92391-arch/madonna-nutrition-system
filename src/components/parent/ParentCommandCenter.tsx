"use client"

import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { AlertCenter, buildAlertItems, countAttentionItems } from "@/components/parent/AlertCenter"
import { InsightsRow } from "@/components/parent/InsightsRow"
import { ParentHero } from "@/components/parent/ParentHero"
import { ParentTopNav } from "@/components/parent/ParentTopNav"
import { QuickActionsStrip } from "@/components/parent/QuickActionsStrip"
import { StudentCardRow } from "@/components/parent/StudentCardRow"
import { TodaysMenuSection } from "@/components/parent/TodaysMenuSection"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { isReviewDue } from "@/lib/food-safety"

export function ParentCommandCenter() {
  const { user } = useAuth()
  const { studentProfiles } = useDemo()

  const firstName = user?.displayName.split(" ")[0] ?? "Parent"
  const totalBalance = parentLinkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const lowBalanceStudents = parentLinkedStudents.filter((s) => s.balance < 5)

  const linkedProfiles = studentProfiles.filter((p) =>
    parentLinkedStudents.some((s) => s.id === p.studentId)
  )
  const reviewDueProfiles = linkedProfiles.filter((p) => isReviewDue(p.allergyExpiresAt))

  const reviewHref =
    reviewDueProfiles.length === 1
      ? `/parent/student-profile/${reviewDueProfiles[0].studentId}`
      : "/parent/student-profile"

  const alertItems = buildAlertItems({
    lowBalanceStudents,
    reviewDueCount: reviewDueProfiles.length,
    reviewHref,
    announcements: parentAnnouncements,
  })

  const navAlertCount = countAttentionItems(alertItems)

  return (
    <div className="flex min-h-full flex-col bg-white">
      <ParentTopNav alertCount={navAlertCount} />

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
        <AlertCenter items={alertItems} />
        <InsightsRow />
        <TodaysMenuSection />
      </div>
    </div>
  )
}
