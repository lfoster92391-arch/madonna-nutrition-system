import { Suspense } from "react"
import { ParentAlertsPage } from "@/components/parent/ParentAlertsPage"

export default function AlertsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-white" />}>
      <ParentAlertsPage />
    </Suspense>
  )
}
