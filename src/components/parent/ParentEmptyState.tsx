"use client"

import Link from "next/link"
import { Users } from "lucide-react"

export function ParentEmptyState() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#001E62]/10 text-[#001E62]">
        <Users className="h-7 w-7" />
      </span>
      <h2 className="text-xl font-semibold text-[#001E62]">No students yet</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        No students are linked to your account yet. Import from Admin to add students and link
        parents to your school.
      </p>
      <p className="mt-4 text-xs text-slate-500">
        School staff: import students in{" "}
        <Link href="/admin" className="font-medium text-[#001E62] underline-offset-2 hover:underline">
          Admin → Launch
        </Link>{" "}
        or contact your nutrition program administrator.
      </p>
    </div>
  )
}
