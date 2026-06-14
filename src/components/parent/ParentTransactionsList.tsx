"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthProvider"
import { useDemo } from "@/components/providers/DemoProvider"
import { DEMO_SCHOOL } from "@/data/demo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export function ParentTransactionsList() {
  const { user } = useAuth()
  const { transactions, users, isLoading } = useDemo()

  const linkedStudentIds = useMemo(() => {
    if (!user) return new Set<string>()
    const demoUser = users.find((u) => u.id === user.id)
    return new Set(demoUser?.linkedStudentIds ?? [])
  }, [user, users])

  const familyTransactions = useMemo(() => {
    return transactions
      .filter((tx) => linkedStudentIds.has(tx.studentId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [transactions, linkedStudentIds])

  if (isLoading) {
    return <p className="p-8 text-silver-foreground">Loading transactions…</p>
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {DEMO_SCHOOL.name} · {DEMO_SCHOOL.location}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-primary">Transactions</h1>
        <p className="mt-2 text-silver-foreground">
          Meal charges and card deposits for your linked students.
        </p>
      </div>

      <Card className="overflow-hidden rounded-[20px] border-silver/60 shadow-sm">
        {familyTransactions.length === 0 ? (
          <p className="p-8 text-silver-foreground">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-silver/40 bg-silver/10 text-left">
                <tr>
                  <th className="px-6 py-3 font-semibold text-primary">Date</th>
                  <th className="px-6 py-3 font-semibold text-primary">Student</th>
                  <th className="px-6 py-3 font-semibold text-primary">Type</th>
                  <th className="px-6 py-3 font-semibold text-primary">Description</th>
                  <th className="px-6 py-3 text-right font-semibold text-primary">Amount</th>
                  <th className="px-6 py-3 text-right font-semibold text-primary">Balance</th>
                </tr>
              </thead>
              <tbody>
                {familyTransactions.map((tx) => {
                  const isDeposit = tx.type === "deposit"
                  return (
                    <tr key={tx.id} className="border-b border-silver/20 last:border-0">
                      <td className="px-6 py-4 text-silver-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-primary">{tx.studentName}</td>
                      <td className="px-6 py-4 capitalize text-silver-foreground">
                        {isDeposit ? "Deposit" : "Meal"}
                      </td>
                      <td className="px-6 py-4 text-silver-foreground">{tx.meal}</td>
                      <td
                        className={`px-6 py-4 text-right font-bold tabular-nums ${
                          isDeposit ? "text-success" : "text-primary"
                        }`}
                      >
                        {isDeposit ? "+" : "−"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-silver-foreground">
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

      <Button asChild variant="outline">
        <Link href="/parent/add-funds">Deposit Funds</Link>
      </Button>
    </div>
  )
}
