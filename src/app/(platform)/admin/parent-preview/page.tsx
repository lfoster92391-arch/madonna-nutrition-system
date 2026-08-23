"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { canAccessParentPortal } from "@/lib/auth/portal-roles"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Admin entry point to preview the parent portal without linking a child.
 * Real parent ownership checks still apply for any student-specific actions.
 */
export default function AdminParentPreviewPage() {
  const { user } = useAuth()
  const canOpen = user ? canAccessParentPortal(user) : false

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#041B52]/60">
            Admin · Fuel The Dons
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#041B52]">View as parent</h1>
          <p className="mt-2 text-[#64748B]">
            Preview the parent experience without attaching a student to your admin account.
            Ordering for a real student still requires a normal parent link — this preview is for
            walking the screens Lisa’s families see.
          </p>
        </header>

        <Card className="rounded-2xl border border-[#AEB6C2]/60 p-6">
          <h2 className="text-lg font-semibold text-[#041B52]">Open parent portal</h2>
          <p className="mt-2 text-sm text-[#64748B]">
            {canOpen
              ? "Your admin login can open the parent portal. Empty student lists are expected until you link a child for real testing."
              : "Sign in as an active admin (for example itlisa) to use parent portal preview."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild disabled={!canOpen}>
              <Link href="/parent">Parent dashboard</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canOpen}>
              <Link href="/parent/reserve-lunch">Order Lunch screen</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canOpen}>
              <Link href="/parent/guide">Parent guide</Link>
            </Button>
            <Button asChild variant="outline" disabled={!canOpen}>
              <Link href="/parent/calendar">Parent calendar</Link>
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
