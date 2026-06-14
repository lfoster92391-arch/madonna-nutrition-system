"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatTransactionDateTime } from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"

type StudentTransactionsTabProps = {
  studentId: string
  studentName: string
}

export function StudentTransactionsTab({ studentId, studentName }: StudentTransactionsTabProps) {
  const { familyTransactions, isLoading } = useParentTransactions()

  const studentTransactions = useMemo(
    () => familyTransactions.filter((tx) => tx.studentId === studentId),
    [familyTransactions, studentId]
  )

  if (isLoading) {
    return <p className="text-sm text-silver-foreground">Loading transactions…</p>
  }

  return (
    <Card className="rounded-[20px] p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary">Transactions</h3>
          <p className="mt-1 text-sm text-silver-foreground">
            Meal charges and deposits for {studentName}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/parent/payments">Open Payments</Link>
        </Button>
      </div>

      {studentTransactions.length === 0 ? (
        <p className="mt-6 text-sm text-silver-foreground">No transactions yet.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[14px] border border-silver/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-silver/40 bg-silver/10 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-primary md:px-6">Date</th>
                  <th className="px-4 py-3 font-semibold text-primary md:px-6">Type</th>
                  <th className="px-4 py-3 font-semibold text-primary md:px-6">Description</th>
                  <th className="px-4 py-3 text-right font-semibold text-primary md:px-6">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-primary md:px-6">Balance</th>
                </tr>
              </thead>
              <tbody>
                {studentTransactions.map((tx) => {
                  const isDeposit = tx.type === "deposit"
                  return (
                    <tr key={tx.id} className="border-b border-silver/20 last:border-0">
                      <td className="px-4 py-3 text-silver-foreground md:px-6">
                        {formatTransactionDateTime(tx.timestamp)}
                      </td>
                      <td className="px-4 py-3 capitalize text-silver-foreground md:px-6">
                        {isDeposit ? "Deposit" : "Meal"}
                      </td>
                      <td className="px-4 py-3 text-silver-foreground md:px-6">{tx.meal}</td>
                      <td
                        className={`px-4 py-3 text-right font-bold tabular-nums md:px-6 ${
                          isDeposit ? "text-success" : "text-primary"
                        }`}
                      >
                        {isDeposit ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-silver-foreground md:px-6">
                        {formatCurrency(tx.balanceAfter)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}
