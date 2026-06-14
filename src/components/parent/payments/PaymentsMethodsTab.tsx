"use client"

import { CreditCard, Plus, Star } from "lucide-react"
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#64748B]">Default method</p>
              <p className="mt-2 text-base font-bold" style={{ color: PARENT_NAVY }}>
                Visa ending in 4242
              </p>
              <p className="mt-1 text-sm text-[#64748B]">Expires 12/28 - Primary card</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#041B52]/5">
              <Star className="h-4 w-4 text-amber-500" />
            </span>
          </div>
        </div>

        <div className={`${PARENT_CARD} p-4 md:p-5`}>
          <p className="text-sm font-semibold text-[#64748B]">Saved cards</p>
          <ul className="mt-3 space-y-2">
            <SavedCardRow brand="Visa" last4="4242" defaultCard />
            <SavedCardRow brand="Mastercard" last4="8210" />
          </ul>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full rounded-[10px] border-[#C8CDD7]"
            style={{ color: PARENT_NAVY }}
            disabled
          >
            <Plus className="mr-2 h-4 w-4" />
            Add card (coming soon)
          </Button>
        </div>
      </div>

      <div className={`${PARENT_CARD} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-[#C8CDD7] px-4 py-3 md:px-5">
          <h3 className="text-base font-bold" style={{ color: PARENT_NAVY }}>
            Billing history
          </h3>
          <CreditCard className="h-4 w-4 text-[#64748B]" aria-hidden />
        </div>
        {isLoading ? (
          <p className="p-5 text-sm text-[#64748B]">Loading billing history...</p>
        ) : billingHistory.length === 0 ? (
          <div className="px-4 py-8 text-center md:px-6">
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b border-[#C8CDD7] bg-[#041B52]/5 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Student
                  </th>
                  <th className="px-4 py-3 font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-semibold md:px-5" style={{ color: PARENT_NAVY }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#C8CDD7]/60 last:border-0">
                    <td className="px-4 py-3 text-[#64748B] md:px-5">
                      {formatTransactionDate(tx.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium md:px-5" style={{ color: PARENT_NAVY }}>
                      {tx.studentName}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] md:px-5">{tx.meal}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-success md:px-5">
                      +{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function SavedCardRow({
  brand,
  last4,
  defaultCard = false,
}: {
  brand: string
  last4: string
  defaultCard?: boolean
}) {
  return (
    <li className="flex items-center justify-between rounded-[10px] border border-[#C8CDD7] px-3 py-2.5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4" style={{ color: PARENT_NAVY }} />
        <span className="text-sm font-medium" style={{ color: PARENT_NAVY }}>
          {brand} .... {last4}
        </span>
      </div>
      {defaultCard && (
        <span className="text-xs font-semibold text-[#64748B]">Default</span>
      )}
    </li>
  )
}
