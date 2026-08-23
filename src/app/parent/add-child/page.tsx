"use client"

import { ParentLinkStudentForm } from "@/components/auth/ParentLinkStudentForm"

/** In-portal sibling / first-child link for parent-capable accounts, including dual-role teachers. */
export default function ParentPortalAddChildPage() {
  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <ParentLinkStudentForm allowSkipToPortal />
      </div>
    </div>
  )
}
