"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, ClipboardCheck, Wallet, type LucideIcon } from "lucide-react"
import { AddFundsModal } from "@/components/parent/funding/AddFundsModal"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { getStudentThreshold } from "@/lib/parent-balance-alerts"
import { formatCurrency } from "@/lib/utils"

export type AlertItem = {
  id: string
  icon: LucideIcon
  headline: string
  description: string
  ctaLabel: string
  href?: string
  studentId?: string
  studentName?: string
  studentBalance?: number
}

export function AlertCenter({ items }: { items: AlertItem[] }) {
  const [fundingStudent, setFundingStudent] = useState<{
    id: string
    name: string
    balance: number
  } | null>(null)

  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
          Attention Needed
        </h2>
        <div className={`${PARENT_CARD} px-6 py-8 text-center`}>
          <p className="text-sm text-[#64748B]">
            No students currently require attention. Your family balances are healthy.
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section>
        <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: PARENT_NAVY }}>
          Attention Needed
        </h2>
        <div className={`${PARENT_CARD} divide-y divide-[#C8CDD7]`}>
          {items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
            >
              <div className="flex gap-4">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#041B52]/5"
                  aria-hidden
                >
                  <item.icon className="h-5 w-5" style={{ color: PARENT_NAVY }} />
                </span>
                <div>
                  <p className="font-semibold" style={{ color: PARENT_NAVY }}>
                    {item.headline}
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">{item.description}</p>
                </div>
              </div>
              {item.studentId && item.studentName != null && item.studentBalance != null ? (
                <div className="flex shrink-0 flex-wrap gap-2 sm:ml-4">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-[10px] px-4 text-sm font-semibold"
                    style={{ backgroundColor: PARENT_NAVY }}
                    onClick={() =>
                      setFundingStudent({
                        id: item.studentId!,
                        name: item.studentName!,
                        balance: item.studentBalance!,
                      })
                    }
                  >
                    Add Funds
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-[10px] px-4 text-sm font-semibold"
                  >
                    <Link href={`/parent/student-profile/${item.studentId}`}>View Student</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  size="sm"
                  className="h-9 shrink-0 rounded-[10px] px-4 text-sm font-semibold sm:ml-4"
                  style={{ backgroundColor: PARENT_NAVY }}
                >
                  <Link href={item.href ?? "#"}>{item.ctaLabel}</Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {fundingStudent && (
        <AddFundsModal
          open={!!fundingStudent}
          onOpenChange={(open) => {
            if (!open) setFundingStudent(null)
          }}
          studentId={fundingStudent.id}
          studentName={fundingStudent.name}
          balance={fundingStudent.balance}
        />
      )}
    </>
  )
}

/** Build prioritized alert list from dashboard data */
export function buildAlertItems(input: {
  lowBalanceStudents: { id: string; firstName: string; lastName: string; balance: number }[]
  dietaryFormIssueCount: number
  reviewHref: string
  announcements: { id: string; title: string; body: string }[]
}): AlertItem[] {
  const items: AlertItem[] = []

  if (input.dietaryFormIssueCount > 0) {
    items.push({
      id: "dietary-form",
      icon: ClipboardCheck,
      headline: "Dietary & Food Allergy Form Required",
      description: `${input.dietaryFormIssueCount} student${input.dietaryFormIssueCount > 1 ? "s need" : " needs"} a complete or updated dietary and allergy form.`,
      ctaLabel: "Update Forms",
      href: input.reviewHref,
    })
  }

  for (const student of input.lowBalanceStudents) {
    const threshold = getStudentThreshold(student.id)
    items.push({
      id: `low-balance-${student.id}`,
      icon: Wallet,
      headline: `⚠ ${student.firstName} balance below threshold`,
      description: `${formatCurrency(student.balance)} remaining — notify below ${formatCurrency(threshold)}.`,
      ctaLabel: "Add Funds",
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentBalance: student.balance,
    })
  }

  for (const ann of input.announcements) {
    items.push({
      id: ann.id,
      icon: Bell,
      headline: ann.title,
      description: ann.body,
      ctaLabel: "View Details",
      href: "/parent/notifications",
    })
  }

  return items
}

export function countAttentionItems(items: AlertItem[]): number {
  return items.length
}
