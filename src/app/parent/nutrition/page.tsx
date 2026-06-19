"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"

export default function ParentNutritionPage() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Food Preferences
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Review menus, allergens, and dietary guidance for your students.
        </p>
      </header>
      <div className={`${PARENT_CARD} p-6 md:p-8`}>
        <p className="text-sm text-[#64748B]">
          Nutrition profiles are managed in the Food Safety Center for each student.
        </p>
        <Button asChild className="mt-6 rounded-[10px]" style={{ backgroundColor: PARENT_NAVY }}>
          <Link href="/parent/student-profile">Open Food Safety Center</Link>
        </Button>
      </div>
    </div>
  )
}
