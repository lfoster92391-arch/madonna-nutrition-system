"use client"

import Link from "next/link"
import { ArrowLeftRight, CreditCard, Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type FamilyBalanceSlideOverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalBalance: number
  lowBalanceCount: number
  suggestedDeposit: number
  defaultStudentId?: string
}

export function FamilyBalanceSlideOver({
  open,
  onOpenChange,
  totalBalance,
  lowBalanceCount,
  suggestedDeposit,
  defaultStudentId,
}: FamilyBalanceSlideOverProps) {
  const addFundsHref = defaultStudentId
    ? `/parent/add-funds?student=${defaultStudentId}`
    : "/parent/add-funds"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Family Balance
          </DialogTitle>
          <DialogDescription>
            Total balance: {formatCurrency(totalBalance)}.
            {lowBalanceCount > 0
              ? ` ${lowBalanceCount} student${lowBalanceCount > 1 ? "s" : ""} need funds.`
              : " All accounts are in good standing."}
            {suggestedDeposit > 0 && ` Suggested deposit: ${formatCurrency(suggestedDeposit)}.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href={addFundsHref} onClick={() => onOpenChange(false)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Funds
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={addFundsHref} onClick={() => onOpenChange(false)}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer Balance
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
