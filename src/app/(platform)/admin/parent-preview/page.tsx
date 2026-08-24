"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import {
  canAccessParentPortal,
  canPreviewPortalsAsAdmin,
} from "@/lib/auth/portal-roles"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Admin entry point to preview parent / teacher / staff / student portals
 * without changing the admin role.
 */
export default function AdminParentPreviewPage() {
  const { user } = useAuth()
  const canOpenParent = user ? canAccessParentPortal(user) : false
  const canPreview = user ? canPreviewPortalsAsAdmin(user) : false

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#041B52]/60">
            Admin · Fuel The Dons
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#041B52]">Portal preview</h1>
          <p className="mt-2 text-[#64748B]">
            Sign in at each portal login with your admin email to walk the screens families and
            staff see. Your account stays Admin — this does not demote you.
          </p>
        </header>

        <Card className="rounded-2xl border border-[#AEB6C2]/60 p-6">
          <h2 className="text-lg font-semibold text-[#041B52]">Open portals</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            {canPreview
              ? "Use the same admin password on each login page below."
              : "Sign in as an active admin (for example itlisa) to use portal preview."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild disabled={!canOpenParent}>
              <Link href="/login/parent">Parent login</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/login/teacher">Teacher login</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/login/staff">Staff login</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/login/student">Student login</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login/admin">Admin login</Link>
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline" disabled={!canOpenParent}>
              <Link href="/parent">Parent dashboard</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/teacher">Teacher home</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/staff">Staff home</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canPreview}>
              <Link href="/student">Student home</Link>
            </Button>
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#AEB6C2]/60 p-6">
          <h2 className="text-lg font-semibold text-[#041B52]">Publish menus for parents</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            Parents can only order on days you publish. Open Menu (lunch calendar), schedule menu
            days, then use Publish day / Publish month or check “Publish to parent &amp; staff
            calendars.”
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/calendar">Open Menu calendar</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
