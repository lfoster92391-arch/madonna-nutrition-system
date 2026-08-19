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
        No students are linked to your account yet. Search for your child by name or MD ID to
        connect their lunch account.
      </p>
      <Link
        href="/parent/add-child"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#001E62] px-5 text-sm font-semibold text-white"
      >
        Link your child
      </Link>
      <p className="mt-4 text-xs text-slate-500">
        Teachers and staff can also use Settings → Add your child. Nutrition admins can import
        families in{" "}
        <Link href="/admin/imports" className="font-medium text-[#001E62] underline-offset-2 hover:underline">
          Admin → Imports
        </Link>
        .
      </p>
    </div>
  )
}
