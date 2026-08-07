"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { useStaffData } from "@/components/providers/StaffDataProvider"
import { AddFundsModal } from "@/components/parent/funding/AddFundsModal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { formatCurrency } from "@/lib/utils"

type LinkedChild = {
  id: string
  firstName: string
  lastName: string
  grade: string
  balance: number
}

export function StaffAccountView() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const { profile } = useStaffData()
  const searchParams = useSearchParams()
  const [children, setChildren] = useState<LinkedChild[]>([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [fundingChild, setFundingChild] = useState<LinkedChild | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadChildren = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setChildren([])
      setLoadingChildren(false)
      return
    }
    setLoadingChildren(true)
    try {
      const res = await fetch(`/api/staff/linked-students?staffId=${user.id}`)
      if (res.ok) {
        const data = (await res.json()) as { students?: LinkedChild[] }
        setChildren(data.students ?? [])
      } else {
        setChildren([])
      }
    } finally {
      setLoadingChildren(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadChildren()
  }, [loadChildren])

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      setNotice("Payment received. Your child’s balance will update shortly.")
      void loadChildren()
    } else if (searchParams.get("canceled") === "1") {
      setNotice("Checkout canceled. No charge was made.")
    }
  }, [searchParams, loadChildren])

  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          My Account
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          View your cafeteria balance and linked student accounts
        </p>
      </div>

      {notice && (
        <p
          className="max-w-xl rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: STAFF_SILVER, color: STAFF_NAVY }}
        >
          {notice}
        </p>
      )}

      <Card
        className="max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
          Your staff account
        </h2>
        <p className="mt-2 text-sm text-silver-foreground">
          Personal cafeteria account for staff meals.
        </p>
        <p className="mt-6 text-4xl font-bold" style={{ color: STAFF_NAVY }}>
          {formatCurrency(profile?.accountBalance ?? 0)}
        </p>
        <p className="mt-2 text-sm text-silver-foreground">
          {profile?.displayName ?? "—"} · {profile?.department ?? "Staff"}
        </p>
      </Card>

      <Card
        className="max-w-xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
              Linked children
            </h2>
            <p className="mt-2 text-sm text-silver-foreground">
              See balances and add lunch funds for students linked to your staff account.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/staff/settings/add-child">Add your child</Link>
          </Button>
        </div>

        {loadingChildren ? (
          <p className="mt-6 text-sm text-silver-foreground">Loading…</p>
        ) : children.length === 0 ? (
          <div
            className="mt-6 rounded-2xl border border-dashed px-6 py-8 text-center"
            style={{ borderColor: STAFF_SILVER }}
          >
            <p className="text-sm font-medium text-silver-foreground">No children linked yet</p>
            <p className="mt-2 text-xs text-silver-foreground">
              Use Add your child in Settings to connect a student account.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {children.map((child) => {
              const name = `${child.firstName} ${child.lastName}`
              const low = child.balance < 5
              return (
                <li
                  key={child.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
                  style={{ borderColor: STAFF_SILVER }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: STAFF_NAVY }}>
                      {name}
                    </p>
                    <p className="text-xs text-silver-foreground">
                      MD {child.id} · Grade {child.grade}
                    </p>
                    <p
                      className={`mt-1 text-lg font-bold tabular-nums ${
                        low ? "text-danger" : ""
                      }`}
                      style={low ? undefined : { color: STAFF_NAVY }}
                    >
                      {formatCurrency(child.balance)}
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => setFundingChild(child)}>
                    Add funds
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {fundingChild && (
        <AddFundsModal
          open={Boolean(fundingChild)}
          onOpenChange={(open) => {
            if (!open) setFundingChild(null)
          }}
          studentId={fundingChild.id}
          studentName={`${fundingChild.firstName} ${fundingChild.lastName}`}
          balance={fundingChild.balance}
        />
      )}
    </div>
  )
}
