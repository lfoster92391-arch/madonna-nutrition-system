"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { useStaffData } from "@/components/providers/StaffDataProvider"
import { Card } from "@/components/ui/card"
import { STAFF_BG, STAFF_NAVY, STAFF_SILVER } from "@/components/staff/layout/staff-theme"
import { formatCurrency } from "@/lib/utils"
import type { StaffTransaction } from "@/lib/staff/types"

export function StaffTransactionsView() {
  const { user } = useAuth()
  const { databaseEnabled } = useDemo()
  const { profile } = useStaffData()
  const [transactions, setTransactions] = useState<StaffTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    if (!user || !databaseEnabled) {
      setTransactions([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/staff/transactions?staffId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions ?? [])
      } else {
        setTransactions([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [user, databaseEnabled])

  useEffect(() => {
    void loadTransactions()
  }, [loadTransactions])

  return (
    <div className="space-y-6 p-4 sm:p-6" style={{ backgroundColor: STAFF_BG }}>
      <div>
        <h1 className="text-2xl font-bold" style={{ color: STAFF_NAVY }}>
          Transactions
        </h1>
        <p className="mt-1 text-sm text-silver-foreground">
          Your meal history and linked student cafeteria activity
        </p>
      </div>
      <Card
        className="max-w-4xl rounded-2xl border p-4 shadow-sm sm:p-6"
        style={{ borderColor: STAFF_SILVER }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: STAFF_NAVY }}>
              Recent activity
            </h2>
            <p className="mt-2 text-sm text-silver-foreground">
              Shows cafeteria charges and deposits for students linked to your staff account.
              Link a child under Settings to see their history here.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-silver-foreground">
              Account balance
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: STAFF_NAVY }}>
              {formatCurrency(profile?.accountBalance ?? 0)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-silver-foreground">Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <div
            className="mt-6 rounded-2xl border border-dashed px-6 py-10 text-center"
            style={{ borderColor: STAFF_SILVER }}
          >
            <p className="text-sm font-medium text-silver-foreground">No transactions to display</p>
            <p className="mt-2 text-xs text-silver-foreground">
              Link a child in Settings to see their meal and deposit history.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left" style={{ borderColor: STAFF_SILVER }}>
                <tr>
                  <th className="px-3 py-3 font-semibold" style={{ color: STAFF_NAVY }}>
                    Date
                  </th>
                    <th className="px-3 py-3 font-semibold" style={{ color: STAFF_NAVY }}>
                      Student
                    </th>
                    <th className="px-3 py-3 font-semibold" style={{ color: STAFF_NAVY }}>
                      Type
                    </th>
                    <th className="px-3 py-3 font-semibold" style={{ color: STAFF_NAVY }}>
                      Description
                    </th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: STAFF_NAVY }}>
                    Amount
                  </th>
                  <th className="px-3 py-3 text-right font-semibold" style={{ color: STAFF_NAVY }}>
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isDeposit = tx.type === "deposit"
                  return (
                    <tr
                      key={tx.id}
                      className="border-b last:border-0"
                      style={{ borderColor: STAFF_SILVER }}
                    >
                      <td className="px-3 py-4 text-silver-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-silver-foreground">{tx.studentName}</td>
                      <td className="px-3 py-4 capitalize text-silver-foreground">
                        {isDeposit ? "Deposit" : "Meal"}
                      </td>
                      <td className="px-3 py-4 text-silver-foreground">{tx.meal}</td>
                      <td
                        className={`px-3 py-4 text-right font-bold tabular-nums ${
                          isDeposit ? "text-success" : ""
                        }`}
                        style={isDeposit ? undefined : { color: STAFF_NAVY }}
                      >
                        {isDeposit ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-silver-foreground">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
