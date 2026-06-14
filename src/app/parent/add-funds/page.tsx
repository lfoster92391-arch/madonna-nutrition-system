"use client"

import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { AddFundsForm } from "@/components/parent/AddFundsForm"

export default function AddFundsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AddFundsForm />
    </Suspense>
  )
}
