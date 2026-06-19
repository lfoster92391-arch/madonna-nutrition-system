"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  getPendingSubmission,
  getStudentProfile,
  parentLinkedStudents,
  parentSpendingByWeek,
} from "@/data/demo"
import { countAttentionItems, buildAlertItems } from "@/components/parent/AlertCenter"
import { parentAnnouncements } from "@/data/demo"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { getFoodProfileStatus, isDietaryFormBlocking } from "@/lib/types"
import { FamilyOverviewStrip } from "@/components/parent/student-center/FamilyOverviewStrip"
import { StudentCenterCard } from "@/components/parent/student-center/StudentCenterCard"
import { StudentCenterHeader } from "@/components/parent/student-center/StudentCenterHeader"
import { StudentCenterQuickActions } from "@/components/parent/student-center/StudentCenterQuickActions"

export function StudentCenterPage() {
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValue, setFilterValue] = useState("all")

  const firstName = user?.displayName.split(" ")[0] ?? "Parent"
  const familyBalance = parentLinkedStudents.reduce((sum, s) => sum + s.balance, 0)
  const monthlySpend = parentSpendingByWeek.reduce((sum, w) => sum + w.amount, 0)
  const lowBalanceStudents = parentLinkedStudents.filter((s) => s.balance < 5)

  const dietaryFormIssues = parentLinkedStudents.filter((student) => {
    const profile = getStudentProfile(student.id, studentProfiles)
    const pending = getPendingSubmission(student.id, allergySubmissions)
    return isDietaryFormBlocking(profile, pending)
  })
  const pendingReviewCount = dietaryFormIssues.length

  const reviewHref =
    dietaryFormIssues.length === 1
      ? `/parent/student-profile/${dietaryFormIssues[0].id}?tab=dietary`
      : "/parent/student-profile"

  const actionsNeeded = countAttentionItems(
    buildAlertItems({
      lowBalanceStudents,
      dietaryFormIssueCount: pendingReviewCount,
      reviewHref,
      announcements: parentAnnouncements,
    })
  )

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return parentLinkedStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
      const matchesSearch =
        !query || fullName.includes(query) || student.grade.includes(query)

      if (!matchesSearch) return false

      const profile = getStudentProfile(student.id, studentProfiles)
      const pending = getPendingSubmission(student.id, allergySubmissions)
      const nutritionStatus = getFoodProfileStatus(profile, pending)
      const isLowBalance = student.balance < 5

      switch (filterValue) {
        case "low-balance":
          return isLowBalance
        case "nutrition-review":
          return isDietaryFormBlocking(profile, pending)
        case "active":
          return !isDietaryFormBlocking(profile, pending) && !isLowBalance
        default:
          return true
      }
    })
  }, [searchQuery, filterValue, studentProfiles, allergySubmissions])

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
        <StudentCenterHeader
          parentName={firstName}
          studentCount={parentLinkedStudents.length}
          familyBalance={familyBalance}
          actionsNeeded={actionsNeeded}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterValue={filterValue}
          onFilterChange={setFilterValue}
        />

        <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <StudentCenterCard key={student.id} student={student} />
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <p className="rounded-[14px] border border-[#C8CDD7] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
            No students match your search or filter.
          </p>
        )}

        <FamilyOverviewStrip
          familyBalance={familyBalance}
          studentsActive={parentLinkedStudents.length}
          monthlySpend={monthlySpend}
          pendingReviews={pendingReviewCount}
        />

        <StudentCenterQuickActions />
      </div>
    </div>
  )
}
