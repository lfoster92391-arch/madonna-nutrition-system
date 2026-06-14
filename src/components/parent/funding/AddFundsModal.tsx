"use client"

import Link from "next/link"
import { CreditCard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type AddFundsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  studentName: string
  balance: number
}

export function AddFundsModal({
  open,
  onOpenChange,
  studentId,
  studentName,
  balance,
}: AddFundsModalProps) {
  const addFundsHref = `/parent/add-funds?student=${studentId}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds — {studentName}</DialogTitle>
          <DialogDescription>
            Current balance: {formatCurrency(balance)}. Continue to the funding page to add money to
            this account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={addFundsHref} onClick={() => onOpenChange(false)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Continue to Add Funds
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
