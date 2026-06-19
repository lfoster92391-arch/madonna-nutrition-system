import { Suspense } from "react"
import { PaymentsCenter } from "@/components/parent/payments/PaymentsCenter"

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <PaymentsCenter />
    </Suspense>
  )
}
