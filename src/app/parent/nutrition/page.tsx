"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PARENT_CARD, PARENT_NAVY, PARENT_PAGE_PAD, PARENT_SECTION_GAP } from "@/components/parent/parent-dashboard-styles"

export default function ParentNutritionPage() {
  return (
    <div className={`mx-auto w-full max-w-6xl ${PARENT_PAGE_PAD} ${PARENT_SECTION_GAP}`}>
      <header>
        <h1 className="text-2xl font-bold md:text-3xl" style={{ color: PARENT_NAVY }}>
          Dietary &amp; Food Allergy
        </h1>
        <p className="mt-2 text-sm text-[#64748B]">
          Each linked student must have a complete, current dietary and food allergy form on file.
        </p>
      </header>
      <div className={`${PARENT_CARD} p-6 md:p-8`}>
        <p className="text-sm text-[#64748B]">
          Open a student profile to view or update allergies, dietary restrictions, medical notes,
          and emergency food contacts. Forms require annual review or update when requested by the
          school.
        </p>
        <Button asChild className="mt-6 rounded-[10px]" style={{ backgroundColor: PARENT_NAVY }}>
          <Link href="/parent/student-profile">Manage Student Forms</Link>
        </Button>
      </div>
    </div>
  )
}
