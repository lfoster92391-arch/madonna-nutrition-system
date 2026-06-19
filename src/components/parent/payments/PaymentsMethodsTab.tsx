"use client"

import { Plus } from "lucide-react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { formatTransactionDate } from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"

type PaymentsMethodsTabProps = {
  onAddFunds: () => void
}

export function PaymentsMethodsTab({ onAddFunds }: PaymentsMethodsTabProps) {
  const { depositTransactions, isLoading } = useParentTransactions()
  const billingHistory = depositTransactions.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${PARENT_CARD} p-4 md:p-5`}>
          <p className="text-sm font-semibold text-[#64748B]">Default method</p>
          <p className="mt-2 text-base font-bold" style={{ color: PARENT_NAVY }}>
            Visa ending in 4242
          </p>
          <p className="mt-1 text-sm text-[#64748B]">Expires 12/28</p>
        </div>
        <div className={`${PARENT_CARD} p-4 md:p-5`}>
          <p className="text-sm font-semibold text-[#64748B]">Saved cards</p>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: PARENT_NAVY }}>
            <li>Visa .... 4242 (Default)</li>
            <li>Mastercard .... 8210</li>
          </ul>
          <Button type="button" variant="outline" className="mt-4 w-full rounded-[10px]" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add card (coming soon)
          </Button>
        </div>
      </div>
      <div className={`${PARENT_CARD} overflow-hidden`}>
        <div className="border-b border-[#C8CDD7] px-4 py-3 md:px-5">
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Billing history
          </h3>
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-[#64748B]">Loading...</p>
        ) : billingHistory.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#64748B]">No deposit billing history yet.</p>
            <Button
              type="button"
              className="mt-4 rounded-[10px]"
              style={{ backgroundColor: PARENT_NAVY }}
              onClick={onAddFunds}
            >
              Add Funds
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[#C8CDD7] bg-[#041B52]/5 text-left">
              <tr>
                <th className="px-4 py-3 md:px-5" style={{ color: PARENT_NAVY }}>
                  Date
                </th>
                <th className="px-4 py-3 md:px-5" style={{ color: PARENT_NAVY }}>
                  Student
                </th>
                <th className="px-4 py-3 text-right md:px-5" style={{ color: PARENT_NAVY }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((tx) => (
                <tr key={tx.id} className="border-b border-[#C8CDD7]/60">
                  <td className="px-4 py-3 text-[#64748B] md:px-5">
                    {formatTransactionDate(tx.timestamp)}
                  </td>
                  <td className="px-4 py-3 md:px-5" style={{ color: PARENT_NAVY }}>
                    {tx.studentName}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-success md:px-5">
                    +{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
