"use client"

import Link from "next/link"
import { StaffCalendarPreview } from "@/components/staff/StaffCalendarPreview"
import { StaffDashboardAnnouncements } from "@/components/staff/StaffDashboardAnnouncements"
import { StaffMyLunchToday } from "@/components/staff/StaffMyLunchToday"
import { StaffQuickAccessCards } from "@/components/staff/StaffQuickAccessCards"
import { STAFF_BG, STAFF_NAVY } from "@/components/staff/layout/staff-theme"
import { Card } from "@/components/ui/card"

export default function StaffDashboardPage() {
  return (
    <div
      className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:gap-8"
      style={{ backgroundColor: STAFF_BG }}
    >
      <div className="md:hidden">
        <StaffDashboardAnnouncements />
      </div>
      <StaffMyLunchToday />
      <Card className="rounded-[20px] border p-5 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
          Sign up a student for lunch
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Search any student by MD ID or name, pick published menu days and meal items, then save.
          Reservations count for kitchen prep and clear the kiosk warning.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/staff/sign-up-student"
            className="inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
          >
            Sign up a student
          </Link>
          <Link
            href="/staff/who-signed-up"
            className="inline-flex rounded-xl border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: STAFF_NAVY, color: STAFF_NAVY }}
          >
            Who signed up for lunch
          </Link>
        </div>
      </Card>
      <Card className="rounded-[20px] border p-5 shadow-sm" style={{ borderColor: "#AEB6C2" }}>
        <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
          Order lunch for your child
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Staff who are also parents can open the parent portal to reserve student lunches and
          see saved meal selections.
        </p>
        <Link
          href="/parent/reserve-lunch"
          className="mt-4 inline-flex rounded-xl bg-[#041B52] px-4 py-2 text-sm font-semibold text-white"
        >
          Open parent Order Lunch
        </Link>
      </Card>
      <StaffQuickAccessCards />
      <StaffCalendarPreview />
      <div className="hidden md:block">
        <StaffDashboardAnnouncements />
      </div>
    </div>
  )
}
