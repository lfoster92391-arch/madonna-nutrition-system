"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { buildAlertItems, countAttentionItems } from "@/components/parent/AlertCenter"
import { ParentEmptyState } from "@/components/parent/ParentEmptyState"
import { ParentHero } from "@/components/parent/ParentHero"
import { QuickActionsStrip } from "@/components/parent/QuickActionsStrip"
import { StudentCardRow } from "@/components/parent/StudentCardRow"
import { AddFundsDrawer } from "@/components/parent/v3/drawers/AddFundsDrawer"
import { AlertsDrawer } from "@/components/parent/v3/drawers/AlertsDrawer"
import { MealActivityDrawer } from "@/components/parent/v3/drawers/MealActivityDrawer"
import { SettingsDrawer } from "@/components/parent/v3/drawers/SettingsDrawer"
import { PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"
import {
  PARENT_DRAWER_PARAM,
  PARENT_STUDENT_PARAM,
  parseParentDrawer,
  type ParentDrawerId,
} from "@/components/parent/v3/parent-v3-theme"
import { getPendingSubmission, getStudentProfile } from "@/data/demo"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import { useParentAnnouncements } from "@/hooks/useParentAnnouncements"
import { isDietaryFormBlocking } from "@/lib/types"

function ParentCommandCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { studentProfiles, allergySubmissions } = useDemo()
  const { students: linkedStudents, isLoading } = useParentLinkedStudents()
  const announcements = useParentAnnouncements()

  const drawerParam = parseParentDrawer(searchParams.get(PARENT_DRAWER_PARAM))
  const studentParam = searchParams.get(PARENT_STUDENT_PARAM) ?? undefined
  const [fundingStudentId, setFundingStudentId] = useState<string | undefined>(studentParam)

  const firstName = user?.displayName.split(" ")[0] ?? "Parent"
  const totalBalance = linkedStudents.reduce((sum, s) => sum + s.balance, 0)
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

  const alertItems = buildAlertItems({
    lowBalanceStudents,
    dietaryFormIssueCount: dietaryFormIssues.length,
    reviewHref,
    announcements,
  })

  const navAlertCount = countAttentionItems(alertItems)

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

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#my-students") {
      scrollToStudents()
    }
  }, [])

  if (!isLoading && linkedStudents.length === 0) {
    return (
      <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD}`}>
        <ParentEmptyState />
      </div>
    )
  }

  return (
    <>
      <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
        <ParentHero
          parentName={firstName}
          studentsActive={linkedStudents.length}
          accountBalance={totalBalance}
          actionsRequired={navAlertCount}
          reviewHref={reviewHref}
          onAddFunds={() => openDrawer("add-funds")}
        />
        <StudentCardRow
          onAddFunds={(studentId) => {
            setFundingStudentId(studentId)
            openDrawer("add-funds")
          }}
        />
        <QuickActionsStrip
          onAddFunds={() => openDrawer("add-funds")}
          onHistory={() => openDrawer("meal-activity")}
          onMealActivity={() => openDrawer("meal-activity")}
          onAlerts={() => openDrawer("alerts")}
          onSettings={() => openDrawer("settings")}
          onStudents={scrollToStudents}
        />
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
      <SettingsDrawer
        open={drawerParam === "settings"}
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
    </>
  )
}

export function ParentCommandCenter() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <ParentCommandCenterContent />
    </Suspense>
  )
}
