"use client"

import Link from "next/link"
import { ParentLinkStudentForm } from "@/components/auth/ParentLinkStudentForm"

const NAVY = "#001E62"

/** In-portal sibling / first-child link for parent-capable accounts, including dual-role teachers. */
export default function ParentPortalAddChildPage() {
  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/parent#my-students"
          className="mb-6 inline-block text-sm font-medium hover:underline"
          style={{ color: NAVY }}
        >
          &larr; Back to My Students
        </Link>
        <ParentLinkStudentForm allowSkipToPortal />
      </div>
    </div>
  )
}
