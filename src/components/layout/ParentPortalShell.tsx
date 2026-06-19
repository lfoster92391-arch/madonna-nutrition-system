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
import { getPendingSubmission, getStudentProfile, parentAnnouncements, parentLinkedStudents } from "@/data/demo"
import { isDietaryFormBlocking } from "@/lib/types"

const BARE_ROUTES = ["/parent/agreements"]

function useParentNavAlertCount(): number {
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

  return useMemo(
    () =>
      countAttentionItems(
        buildAlertItems({
          lowBalanceStudents,
          dietaryFormIssueCount: dietaryFormIssues.length,
          reviewHref,
          announcements: parentAnnouncements,
        })
      ),
    [lowBalanceStudents, dietaryFormIssues.length, reviewHref, allergySubmissions, studentProfiles]
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
