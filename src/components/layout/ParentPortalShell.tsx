"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  buildAlertItems,
  countAttentionItems,
} from "@/components/parent/AlertCenter"
import { ParentTopNav } from "@/components/parent/ParentTopNav"
import { getPendingSubmission, getStudentProfile, parentAnnouncements } from "@/data/demo"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { isDietaryFormBlocking } from "@/lib/types"

const BARE_ROUTES = ["/parent/agreements"]

function getParentPageTitle(pathname: string): string {
  if (pathname === "/parent") return "Parent Dashboard"
  if (pathname.startsWith("/parent/students")) return "Students"
  if (pathname.startsWith("/parent/student-profile")) return "Student Profile"
  if (pathname.startsWith("/parent/payments")) return "Payments"
  if (pathname.startsWith("/parent/meal-history")) return "Meal History"
  if (pathname.startsWith("/parent/settings")) return "Settings"
  if (pathname.startsWith("/parent/help")) return "Support"
  if (pathname.startsWith("/parent/notifications") || pathname.startsWith("/parent/alerts")) {
    return "Notifications"
  }
  if (pathname.startsWith("/parent/nutrition")) return "Food Preferences"
  if (pathname.startsWith("/parent/add-funds")) return "Add Funds"
  return "Parent Portal"
}

function useParentNavAlertCount(): number {
  const { studentProfiles, allergySubmissions } = useDemo()
  const { students: linkedStudents } = useParentLinkedStudents()

  const lowBalanceStudents = linkedStudents.filter((s) => s.balance < 5)
  const dietaryFormIssues = linkedStudents.filter((student) => {
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
    [lowBalanceStudents, dietaryFormIssues.length, reviewHref]
  )
}

export function ParentPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const alertCount = useParentNavAlertCount()
  const bare = BARE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  const pageTitle = getParentPageTitle(pathname)

  if (bare) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FB]">
      <ParentTopNav alertCount={alertCount} title={pageTitle} />
      <main className="flex-1 overflow-x-hidden bg-white">{children}</main>
    </div>
  )
}
