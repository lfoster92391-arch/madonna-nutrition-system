"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  getPendingSubmission,
  getStudentProfile,
  parentLinkedStudents,
} from "@/data/demo"
import { FamilyOverviewStrip } from "@/components/parent/student-hub/FamilyOverviewStrip"
import { StudentHubCard } from "@/components/parent/student-hub/StudentHubCard"
import { StudentHubHeader, type FilterStatus } from "@/components/parent/student-hub/StudentHubHeader"
import { StudentHubQuickActions } from "@/components/parent/student-hub/StudentHubQuickActions"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import { isDietaryFormBlocking } from "@/lib/types"

export function StudentHubPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")

  const students = useMemo(() => parentLinkedStudents, [])
  const firstName = user?.displayName.split(" ")[0] ?? "Parent"

  useEffect(() => {
    if (students.length === 1) {
      router.replace(`/parent/student-profile/${students[0].id}`)
    }
  }, [students, router])

  const totalBalance = students.reduce((sum, s) => sum + s.balance, 0)

  const linkedProfiles = studentProfiles.filter((p) =>
    students.some((s) => s.id === p.studentId)
  )

  const pendingReviews = linkedProfiles.filter((p) => {
    const pending = getPendingSubmission(p.studentId, allergySubmissions)
    return isDietaryFormBlocking(p, pending)
  }).length

  const actionsNeeded = students.reduce((count, student) => {
    const profile = getStudentProfile(student.id, studentProfiles)
    const pending = getPendingSubmission(student.id, allergySubmissions)
    if (isDietaryFormBlocking(profile, pending) || student.balance < 5) return count + 1
    return count
  }, 0)

  const mealParticipation = Math.round(
    (students.filter((s) => s.balance >= 3.25).length / Math.max(students.length, 1)) * 100
  )

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return students.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase()
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        student.grade.includes(query) ||
        student.id.includes(query)

      if (!matchesSearch) return false

      if (filterStatus === "low-balance") return student.balance < 5

      if (filterStatus === "action") {
        const profile = getStudentProfile(student.id, studentProfiles)
        const pending = getPendingSubmission(student.id, allergySubmissions)
        return isDietaryFormBlocking(profile, pending) || student.balance < 5
      }

      return true
    })
  }, [students, searchQuery, filterStatus, studentProfiles, allergySubmissions])

  if (students.length === 1) return null

  return (
    <div className="min-h-full bg-white">
      <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
        <StudentHubHeader
          parentName={firstName}
          studentCount={students.length}
          familyBalance={totalBalance}
          actionsNeeded={actionsNeeded}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        <section aria-label="Student hub">
          {filteredStudents.length === 0 ? (
            <p className="rounded-[14px] border border-[#C8CDD7] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
              No students match your search or filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredStudents.map((student) => (
                <StudentHubCard key={student.id} student={student} />
              ))}
            </div>
          )}
        </section>

        <FamilyOverviewStrip
          totalBalance={totalBalance}
          studentsActive={students.length}
          pendingReviews={pendingReviews}
          mealParticipation={mealParticipation}
        />

        <StudentHubQuickActions />
      </div>
    </div>
  )
}
