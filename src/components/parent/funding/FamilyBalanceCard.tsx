"use client"

import { useMemo, useState } from "react"
import { ArrowLeftRight, Wallet } from "lucide-react"
import { FamilyBalanceSlideOver } from "@/components/parent/funding/FamilyBalanceSlideOver"
import { getSuggestedDeposit } from "@/components/parent/funding/useAddFundsPayment"
import { PARENT_CARD, PARENT_NAVY } from "@/components/parent/parent-dashboard-styles"
import { Button } from "@/components/ui/button"
import { useParentLinkedStudents } from "@/hooks/useParentLinkedStudents"
import type { Student } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

type FamilyBalanceCardProps = {
  totalBalance: number
  lowBalanceStudents: Student[]
}

export function FamilyBalanceCard({ totalBalance, lowBalanceStudents }: FamilyBalanceCardProps) {
  const { students: linkedStudents } = useParentLinkedStudents()
  const [slideOverOpen, setSlideOverOpen] = useState(false)

  const suggestedDeposit = useMemo(
    () => getSuggestedDeposit(lowBalanceStudents),
    [lowBalanceStudents]
  )

  const defaultStudentId =
    lowBalanceStudents[0]?.id ?? linkedStudents[0]?.id

  const openSlideOver = () => {
    setSlideOverOpen(true)
  }

  return (
    <>
      <article className={`${PARENT_CARD} flex flex-col justify-between p-5 md:p-6`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#64748B]">Family Balance</p>
            <p className="mt-1 text-2xl font-bold tabular-nums md:text-3xl" style={{ color: PARENT_NAVY }}>
              {formatCurrency(totalBalance)}
            </p>
            {lowBalanceStudents.length > 0 ? (
              <p className="mt-2 text-sm font-semibold text-danger">
                {lowBalanceStudents.length} student
                {lowBalanceStudents.length > 1 ? "s" : ""} low
              </p>
            ) : (
              <p className="mt-2 text-sm text-[#64748B]">All accounts in good standing</p>
            )}
            {suggestedDeposit > 0 && (
              <p className="mt-1 text-xs text-[#64748B]">
                Suggested deposit: {formatCurrency(suggestedDeposit)}
              </p>
            )}
          </div>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#041B52]/5"
            aria-hidden
          >
            <Wallet className="h-5 w-5" style={{ color: PARENT_NAVY }} />
          </span>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            className="h-10 flex-1 rounded-[10px] text-sm font-semibold"
            style={{ backgroundColor: PARENT_NAVY }}
            onClick={() => openSlideOver()}
          >
            Add Funds
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-[10px] border-[#C8CDD7] text-sm font-semibold"
            style={{ color: PARENT_NAVY }}
            onClick={() => openSlideOver()}
          >
            <ArrowLeftRight className="mr-1.5 h-4 w-4" />
            Transfer
          </Button>
        </div>
      </article>

      <FamilyBalanceSlideOver
        open={slideOverOpen}
        onOpenChange={setSlideOverOpen}
        totalBalance={totalBalance}
        lowBalanceCount={lowBalanceStudents.length}
        suggestedDeposit={suggestedDeposit}
        defaultStudentId={defaultStudentId}
      />
    </>
  )
}
