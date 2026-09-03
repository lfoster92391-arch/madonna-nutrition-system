"use client"

import { GroupedOptionNav } from "@/components/nav/GroupedOptionNav"
import { TEACHER_NAV_CATEGORIES } from "@/components/teacher/teacher-nav-groups"

export function TeacherQuickAccessCards() {
  return (
    <GroupedOptionNav
      categories={TEACHER_NAV_CATEGORIES}
      heading="Quick Access"
      layout="grid"
    />
  )
}
