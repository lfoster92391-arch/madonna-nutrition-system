"use client"

import Link from "next/link"
import { TeacherCalendarPreview } from "@/components/teacher/TeacherCalendarPreview"
import { TeacherDashboardAnnouncements } from "@/components/teacher/TeacherDashboardAnnouncements"
import { TeacherFindStudentSection } from "@/components/teacher/TeacherFindStudentSection"
import { TeacherQuickAccessCards } from "@/components/teacher/TeacherQuickAccessCards"
import { MyLunchToday } from "@/components/teacher/MyLunchToday"
import { TEACHER_BG } from "@/components/teacher/layout/teacher-theme"
import { Card } from "@/components/ui/card"
import { TEACHER_NAVY } from "@/config/teacher-theme"

export default function TeacherDashboardPage() {
  return (
    <div
      className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:gap-8"
      style={{ backgroundColor: TEACHER_BG }}
    >
      <div className="md:hidden">
        <TeacherDashboardAnnouncements />
      </div>
      <MyLunchToday />
      <Card className="rounded-[20px] border p-5 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          Sign up a student for lunch
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Search any student by MD ID or name, pick published menu days and meal items, then save.
          Reservations count for kitchen prep and clear the kiosk warning.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/teacher/sign-up-student"
            className="inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
          >
            Sign up a student
          </Link>
          <Link
            href="/teacher/who-signed-up"
            className="inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: TEACHER_NAVY, color: TEACHER_NAVY }}
          >
            Who signed up for lunch
          </Link>
        </div>
      </Card>
      <Card className="rounded-[20px] border p-5 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: TEACHER_NAVY }}>
          Order lunch for your child
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Teachers who are also parents can open the parent portal to reserve student lunches,
          see saved meal selections, and manage linked children.
        </p>
        <Link
          href="/parent/reserve-lunch"
          className="mt-4 inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
        >
          Open parent Order Lunch
        </Link>
      </Card>
      <TeacherFindStudentSection />
      <TeacherQuickAccessCards />
      <TeacherCalendarPreview />
      <div className="hidden md:block">
        <TeacherDashboardAnnouncements />
      </div>
    </div>
  )
}
