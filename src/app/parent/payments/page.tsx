import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { PaymentsCenter } from "@/components/parent/payments/PaymentsCenter"

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentsCenter defaultTab="overview" />
    </Suspense>
  )
}
