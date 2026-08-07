import { Suspense } from "react"
import { StaffAccountView } from "@/components/staff/StaffAccountView"

export default function StaffAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] p-8 text-silver-foreground">Loading…</div>}>
      <StaffAccountView />
    </Suspense>
  )
}
