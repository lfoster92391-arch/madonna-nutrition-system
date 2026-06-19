"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import {
  getPendingSubmission,
  getStudentProfile,
  parentAnnouncements,
  parentLinkedStudents,
} from "@/data/demo"
import { isDietaryFormBlocking } from "@/lib/types"
import {
  buildAlertItems,
  countAttentionItems,
} from "@/components/parent/AlertCenter"
import { ActionTiles } from "@/components/parent/v3/ActionTiles"
import { AddFundsDrawer } from "@/components/parent/v3/drawers/AddFundsDrawer"
import { AlertsDrawer } from "@/components/parent/v3/drawers/AlertsDrawer"
import { MealActivityDrawer } from "@/components/parent/v3/drawers/MealActivityDrawer"
import { SettingsDrawer } from "@/components/parent/v3/drawers/SettingsDrawer"
import { FamilyHero } from "@/components/parent/v3/FamilyHero"
import { FamilyOverviewStrip } from "@/components/parent/v3/FamilyOverviewStrip"
import { ParentV3Header } from "@/components/parent/v3/ParentV3Header"
import { RecentActivityFeed } from "@/components/parent/v3/RecentActivityFeed"
import { StudentCardGrid } from "@/components/parent/v3/StudentCardGrid"
import {
  PARENT_DRAWER_PARAM,
  PARENT_STUDENT_PARAM,
  parseParentDrawer,
  V3_MAX_WIDTH,
  V3_PAGE_PAD,
  V3_SECTION_GAP,
  type ParentDrawerId,
} from "@/components/parent/v3/parent-v3-theme"

function ParentFamilyHubContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()

  const drawerParam = parseParentDrawer(searchParams.get(PARENT_DRAWER_PARAM))
  const studentParam = searchParams.get(PARENT_STUDENT_PARAM) ?? undefined
  const [fundingStudentId, setFundingStudentId] = useState<string | undefined>(studentParam)

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

  const actionNeeded = countAttentionItems(alertItems)
  const pendingReviews = dietaryFormIssues.length
  const participation = useMemo(() => {
    const active = parentLinkedStudents.filter((s) => s.balance > 0).length
    return parentLinkedStudents.length
      ? Math.round((active / parentLinkedStudents.length) * 100)
      : 0
  }, [])

  const setDrawer = useCallback(
    (drawer: ParentDrawerId, studentId?: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (drawer) {
        params.set(PARENT_DRAWER_PARAM, drawer)
      } else {
        params.delete(PARENT_DRAWER_PARAM)
      }
      if (studentId) {
        params.set(PARENT_STUDENT_PARAM, studentId)
        setFundingStudentId(studentId)
      } else if (!drawer || drawer !== "add-funds") {
        params.delete(PARENT_STUDENT_PARAM)
        setFundingStudentId(undefined)
      }
      const query = params.toString()
      router.replace(query ? `/parent?${query}` : "/parent", { scroll: false })
    },
    [router, searchParams]
  )

  const openDrawer = (id: Exclude<ParentDrawerId, null>) => setDrawer(id)
  const closeDrawer = () => setDrawer(null)

  const scrollToStudents = () => {
    document.getElementById("my-students")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <ParentV3Header />

      <div className={`${V3_MAX_WIDTH} ${V3_PAGE_PAD} ${V3_SECTION_GAP} flex-1`}>
        <FamilyHero
          parentName={firstName}
          familyBalance={totalBalance}
          studentsCount={parentLinkedStudents.length}
          actionNeeded={actionNeeded}
          onViewStudents={scrollToStudents}
          onAddFunds={() => openDrawer("add-funds")}
          onViewAlerts={() => openDrawer("alerts")}
        />

        <StudentCardGrid
          onAddFunds={(studentId) => {
            setFundingStudentId(studentId)
            openDrawer("add-funds")
          }}
        />

        <ActionTiles onOpenDrawer={openDrawer} />

        <FamilyOverviewStrip
          totalBalance={totalBalance}
          studentsActive={parentLinkedStudents.length}
          pendingReviews={pendingReviews}
          participation={participation}
        />
      </div>

      <div className={`${V3_MAX_WIDTH} ${V3_PAGE_PAD} pb-10 pt-2`}>
        <RecentActivityFeed />
      </div>

      <AddFundsDrawer
        open={drawerParam === "add-funds"}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        initialStudentId={fundingStudentId ?? studentParam}
      />
      <MealActivityDrawer
        open={drawerParam === "meal-activity"}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
      />
      <AlertsDrawer
        open={drawerParam === "alerts"}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
        items={alertItems}
      />
      <SettingsDrawer
        open={drawerParam === "settings"}
        onOpenChange={(open) => {
          if (!open) closeDrawer()
        }}
      />
    </div>
  )
}

export function ParentFamilyHub() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ParentFamilyHubContent />
    </Suspense>
  )
}
