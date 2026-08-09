import { Suspense } from "react"
import { FinancialsHub } from "@/components/admin/FinancialsHub"

export default function AdminFinancePage() {
  return (
    <Suspense fallback={<p className="admin-page-pad text-silver-foreground">Loading Financials…</p>}>
      <FinancialsHub />
    </Suspense>
  )
}
