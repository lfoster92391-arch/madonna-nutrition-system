"use client"

import { ShieldCheck } from "lucide-react"
import { useParentTransactions } from "@/components/parent/useParentTransactions"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { formatTransactionDate } from "@/lib/parent-transactions"
import { formatCurrency } from "@/lib/utils"
import { CARD_SAFETY_COPY } from "@/lib/security/card-copy"

type PaymentsMethodsTabProps = {
  onAddFunds: () => void
}

export function PaymentsMethodsTab({ onAddFunds }: PaymentsMethodsTabProps) {
  const { depositTransactions, isLoading } = useParentTransactions()
  const billingHistory = depositTransactions.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className={`${PARENT_CARD} p-4 md:p-5`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: PARENT_NAVY }} />
          <div>
            <p className="text-base font-bold" style={{ color: PARENT_NAVY }}>
              Cards are never saved
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{CARD_SAFETY_COPY}</p>
            <p className="mt-2 text-sm text-[#64748B]">
              Each deposit opens Stripe Checkout so you enter card details fresh. Fuel The Dons
              never stores your card number or CVV.
            </p>
            <Button
              type="button"
              className="mt-4 rounded-[10px]"
              style={{ backgroundColor: PARENT_NAVY }}
              onClick={onAddFunds}
            >
              Add Funds Securely
            </Button>
          </div>
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
