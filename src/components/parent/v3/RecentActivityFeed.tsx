"use client"

import { useMemo } from "react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { parentLinkedStudents } from "@/data/demo"
import { V3_CARD, V3_CARD_BORDER, V3_NAVY } from "@/components/parent/v3/parent-v3-theme"
import { formatCurrency } from "@/lib/utils"
import { formatTransactionDate } from "@/lib/parent-transactions"
import { getStudentThreshold } from "@/lib/parent-balance-alerts"

type FeedItem = {
  id: string
  label: string
  detail: string
  amount?: string
  tone: "meal" | "deposit" | "alert"
}

export function RecentActivityFeed() {
  const { familyTransactions } = useParentTransactions()

  const items = useMemo(() => {
    const feed: FeedItem[] = []

    for (const tx of familyTransactions.slice(0, 6)) {
      const isDeposit = tx.type === "deposit"
      feed.push({
        id: tx.id,
        label: isDeposit ? "Family Deposit" : `${tx.studentName?.split(" ")[0] ?? "Student"}`,
        detail: isDeposit
          ? formatTransactionDate(tx.timestamp)
          : `${tx.meal} · ${formatTransactionDate(tx.timestamp)}`,
        amount: isDeposit ? `+${formatCurrency(tx.amount)}` : `−${formatCurrency(tx.amount)}`,
        tone: isDeposit ? "deposit" : "meal",
      })
    }

    for (const student of parentLinkedStudents) {
      if (student.balance < getStudentThreshold(student.id)) {
        feed.push({
          id: `alert-${student.id}`,
          label: student.firstName,
          detail: "Low balance",
          amount: formatCurrency(student.balance),
          tone: "alert",
        })
      }
    }

    return feed.slice(0, 8)
  }, [familyTransactions])

  return (
    <section aria-label="Recent family activity">
      <h2 className="mb-4 text-lg font-bold md:mb-6 md:text-xl" style={{ color: V3_NAVY }}>
        Recent Family Activity
      </h2>
      <div className={`${V3_CARD} ${V3_CARD_BORDER} divide-y divide-[#C7CCD6]`}>
        {items.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-[#64748B]">No recent activity yet.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-5 py-4 md:px-6"
            >
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: V3_NAVY }}>
                  {item.label}
                  {item.tone === "meal" && item.detail ? ` — ${item.detail.split(" · ")[0]}` : ""}
                </p>
                <p className="mt-0.5 truncate text-sm text-[#64748B]">
                  {item.tone === "alert" ? item.detail : item.detail}
                </p>
              </div>
              {item.amount && (
                <p
                  className="shrink-0 text-sm font-bold tabular-nums"
                  style={{
                    color:
                      item.tone === "deposit"
                        ? "#16A34A"
                        : item.tone === "alert"
                          ? "#EA580C"
                          : V3_NAVY,
                  }}
                >
                  {item.amount}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
