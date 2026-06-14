"use client"

import { MyLunchToday } from "@/components/teacher/MyLunchToday"
import { PickupPaymentCard } from "@/components/teacher/PickupPaymentCard"
import { StudentFoundPanel } from "@/components/teacher/StudentFoundPanel"
import { StudentLookup } from "@/components/teacher/StudentLookup"
import { StudentsSignedUpTable } from "@/components/teacher/StudentsSignedUpTable"
import { TeacherAnnouncements } from "@/components/teacher/TeacherAnnouncements"
import { TeacherDashboardHeader } from "@/components/teacher/TeacherDashboardHeader"
import { TeacherPortalBanner } from "@/components/teacher/TeacherPortalBanner"
import { TeacherQuickActions } from "@/components/teacher/TeacherQuickActions"
import { TodayAtAGlance } from "@/components/teacher/TodayAtAGlance"

export default function TeacherDashboardPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <TeacherPortalBanner />
      <TeacherDashboardHeader />
      <div className="space-y-6 p-8">
        <div className="grid gap-6 xl:grid-cols-2">
          <MyLunchToday />
          <PickupPaymentCard />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <StudentLookup />
          <StudentFoundPanel />
          <StudentsSignedUpTable />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <TeacherQuickActions />
          <TodayAtAGlance />
          <TeacherAnnouncements />
        </div>
      </div>
    </div>
  )
}
