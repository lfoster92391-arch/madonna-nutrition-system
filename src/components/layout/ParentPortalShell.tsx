"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useDemo } from "@/components/providers/DemoProvider"
import { ParentSidebar } from "@/components/layout/ParentSidebar"
import {
  buildAlertItems,
  countAttentionItems,
} from "@/components/parent/AlertCenter"
import { ParentTopNav } from "@/components/parent/ParentTopNav"
import { parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { isReviewDue } from "@/lib/food-safety"

const BARE_ROUTES = ["/parent/agreements"]

function useParentNavAlertCount(): number {
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

  return useMemo(
    () =>
      countAttentionItems(
        buildAlertItems({
          lowBalanceStudents,
          reviewDueCount: reviewDueProfiles.length,
          reviewHref,
          announcements: parentAnnouncements,
        })
      ),
    [lowBalanceStudents, reviewDueProfiles.length, reviewHref]
  )
}

export function ParentPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const alertCount = useParentNavAlertCount()
  const bare = BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (bare) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <ParentSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-white">
        <ParentTopNav alertCount={alertCount} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
