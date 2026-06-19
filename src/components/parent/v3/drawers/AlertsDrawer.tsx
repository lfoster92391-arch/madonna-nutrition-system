"use client"

import { useState } from "react"
import Link from "next/link"
import { AddFundsDrawer } from "@/components/parent/v3/drawers/AddFundsDrawer"
import { ParentDrawerShell } from "@/components/parent/v3/ParentDrawerShell"
import { V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import type { AlertItem } from "@/components/parent/AlertCenter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AlertsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: AlertItem[]
}

export function AlertsDrawer({ open, onOpenChange, items }: AlertsDrawerProps) {
  const [fundingStudentId, setFundingStudentId] = useState<string | undefined>()
  const [addFundsOpen, setAddFundsOpen] = useState(false)

  return (
    <>
      <ParentDrawerShell
        open={open}
        onOpenChange={onOpenChange}
        title="Alerts"
        description="Items that may need your attention."
        wide
      >
        {items.length === 0 ? (
          <p className="rounded-[16px] border border-[#C7CCD6] px-6 py-8 text-center text-sm text-[#64748B]">
            No alerts right now. Your family balances look healthy.
          </p>
        ) : (
          <ul className={cn("divide-y divide-[#C7CCD6] rounded-[16px] border", V3_CARD_BORDER)}>
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#041B52]/5"
                    aria-hidden
                  >
                    <item.icon className="h-5 w-5" style={{ color: V3_NAVY }} />
                  </span>
                  <div>
                    <p className="font-semibold" style={{ color: V3_NAVY }}>
                      {item.headline}
                    </p>
                    <p className="mt-1 text-sm text-[#64748B]">{item.description}</p>
                  </div>
                </div>
                {item.studentId ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 rounded-[12px] px-4 text-sm font-semibold text-white"
                      style={{ backgroundColor: V3_NAVY }}
                      onClick={() => {
                        setFundingStudentId(item.studentId)
                        setAddFundsOpen(true)
                      }}
                    >
                      Add Funds
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-[12px] border-[#C7CCD6] px-4 text-sm font-semibold"
                    >
                      <Link href={`/parent/student-profile/${item.studentId}`}>Open Student</Link>
                    </Button>
                  </div>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="h-10 shrink-0 rounded-[12px] px-4 text-sm font-semibold text-white"
                    style={{ backgroundColor: V3_NAVY }}
                  >
                    <Link href={item.href ?? "#"}>{item.ctaLabel}</Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </ParentDrawerShell>

      <AddFundsDrawer
        open={addFundsOpen}
        onOpenChange={(next) => {
          setAddFundsOpen(next)
          if (!next) setFundingStudentId(undefined)
        }}
        initialStudentId={fundingStudentId}
      />
    </>
  )
}
